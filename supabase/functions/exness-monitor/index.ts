import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.2";

const baseUrl = Deno.env.get("META_API_BASE_URL") || "https://mt-client-api-v1.london.agiliumtrade.ai";

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase env vars.");
      return new Response("Server Configuration Error", { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch live BYOB users
    const { data: users, error: usersError } = await supabase
      .from("user_risk_settings")
      .select("*")
      .eq("is_live_execution_enabled", true)
      .not("meta_api_token", "is", null)
      .not("meta_api_account_id", "is", null);

    if (usersError || !users) {
      return new Response("Failed to fetch users", { status: 500 });
    }

    const report = [];

    for (const user of users) {
      const userToken = user.meta_api_token;
      const userAccountId = user.meta_api_account_id;
      const userId = user.user_id;

      console.log(`[Exness Monitor] Processing user ${userId}...`);
      const positionsUrl = `${baseUrl}/users/current/accounts/${userAccountId}/positions`;
      
      let positions = [];
      try {
        const posResponse = await fetch(positionsUrl, {
          headers: { "auth-token": userToken },
        });

        if (!posResponse.ok) {
          const err = await posResponse.text();
          console.error(`[Exness Monitor] User ${userId} failed to fetch positions: ${err}`);
          continue;
        }

        positions = await posResponse.json();
      } catch (e) {
        console.error(`[Exness Monitor] User ${userId} fetch exception: ${e}`);
        continue;
      }

      console.log(`[Exness Monitor] User ${userId} has ${positions.length} open positions.`);

      const trails = [];

      for (const pos of positions) {
        const { id, type, symbol, openPrice, currentPrice, stopLoss, takeProfit, time } = pos;

        // --- 1. Dynamic Trade Termination (Thesis Validation) ---
        console.log(`[Exness Monitor] Validating thesis for open trade ${symbol} (${id})...`);
        
        // Fetch latest AI bias
        const { data: latestSignals } = await supabase
          .from("trade_opportunities")
          .select("side")
          .eq("symbol", symbol)
          .order("created_at", { ascending: false })
          .limit(1);

        const posSide = type === "POSITION_TYPE_BUY" ? "LONG" : "SHORT";
        let shouldClose = false;

        if (latestSignals && latestSignals.length > 0) {
          const aiSide = latestSignals[0].side;
          if (aiSide === posSide) {
            console.log(`[Exness Monitor] AI validated ${posSide} bias for ${symbol}. Keeping position open.`);
          } else {
            console.log(`[Exness Monitor] AI bias flipped to ${aiSide} for ${symbol}. Thesis invalidated!`);
            shouldClose = true;
          }
        } else {
          console.log(`[Exness Monitor] No recent AI data for ${symbol}. Holding trade (Option B logic).`);
        }

        if (shouldClose) {
            const closeUrl = `${baseUrl}/users/current/accounts/${userAccountId}/trade`;
            const closePayload = {
              actionType: "POSITION_CLOSE_ID",
              positionId: id
            };

            const closeResponse = await fetch(closeUrl, {
              method: "POST",
              headers: {
                "auth-token": userToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(closePayload)
            });

            if (closeResponse.ok) {
              console.log(`[Exness Monitor] Successfully closed invalid position ${id}`);
              trails.push({ id, symbol, success: true, closed_due_to_dynamic_term: true });
            } else {
              const err = await closeResponse.text();
              console.error(`[Exness Monitor] Failed to close invalid position ${id}: ${err}`);
              await supabase.from("meta_api_retry_queue").insert({
                 user_id: userId,
                 meta_api_account_id: userAccountId,
                 request_type: "POSITION_CLOSE",
                 api_payload: closePayload,
                 last_error: err
              });
              trails.push({ id, symbol, success: false, closed_due_to_dynamic_term: false, error: err, queued_for_retry: true });
            }
            continue; // Skip trailing stop logic since we initiated a close
          }

        // --- 2. Advanced Trailing Stop Logic ---
        if (!stopLoss || !takeProfit || !openPrice || !currentPrice) {
          continue;
        }

        let shouldTrail = false;
        let newStopLoss = openPrice; // Trail to exactly breakeven

        if (type === "POSITION_TYPE_BUY") {
          if (stopLoss < openPrice) {
            const initialRisk = openPrice - stopLoss;
            const currentProfit = currentPrice - openPrice;
            if (currentProfit > 0 && currentProfit >= initialRisk) {
              shouldTrail = true;
            }
          }
        } else if (type === "POSITION_TYPE_SELL") {
          if (stopLoss > openPrice) {
            const initialRisk = stopLoss - openPrice;
            const currentProfit = openPrice - currentPrice;
            if (currentProfit > 0 && currentProfit >= initialRisk) {
              shouldTrail = true;
            }
          }
        }

        if (shouldTrail) {
          console.log(`[Exness Monitor] Trailing stop for ${symbol} (${id}). Moving SL from ${stopLoss} -> ${newStopLoss} (Breakeven).`);
          
          const modifyUrl = `${baseUrl}/users/current/accounts/${userAccountId}/trade`;
          const payload = {
            actionType: "POSITION_MODIFY",
            positionId: id,
            stopLoss: newStopLoss
          };

          const modifyResponse = await fetch(modifyUrl, {
            method: "POST",
            headers: {
              "auth-token": userToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
          });

          if (modifyResponse.ok) {
            console.log(`[Exness Monitor] Successfully updated stop loss for ${id}`);
            trails.push({ id, symbol, success: true, newStopLoss });
          } else {
            const err = await modifyResponse.text();
            console.error(`[Exness Monitor] Failed to update SL for ${id}: ${err}`);
            await supabase.from("meta_api_retry_queue").insert({
               user_id: userId,
               meta_api_account_id: userAccountId,
               request_type: "POSITION_MODIFY",
               api_payload: payload,
               last_error: err
            });
            trails.push({ id, symbol, success: false, error: err, queued_for_retry: true });
          }
        }
      }
      
      report.push({ user_id: userId, positions_checked: positions.length, trailed: trails });
    }

    return new Response(JSON.stringify({
      success: true,
      processed_users: report.length,
      report: report
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error(`[Exness Monitor] Exception:`, error);
    return new Response(`Server error: ${error.message}`, { status: 500 });
  }
});
