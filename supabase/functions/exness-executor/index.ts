import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.2";
import { validateUserExposure } from "../../../packages/strategy/riskManager.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: "trade_opportunities";
  record: any;
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" && payload.type !== "UPDATE") {
      return new Response("Ignored non-actionable webhook", { status: 200 });
    }

    const signal = payload.record;
    const oldSignal = (payload as any).old_record;
    
    if (payload.type === "UPDATE" && oldSignal && oldSignal.status === "APPROVED") {
      return new Response("Signal was already approved. Ignoring.", { status: 200 });
    }

    if (signal.status !== "APPROVED") {
      return new Response("Signal not approved.", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all active user risk settings
    const { data: users, error: usersError } = await supabase
      .from("user_risk_settings")
      .select("*");

    if (usersError || !users) {
      return new Response("No users found or error querying users.", { status: 500 });
    }

    const entryPlan = signal.entry_plan_json || {};
    const stopPlan = signal.stop_plan_json || {};

    const entryPrice = entryPlan.price || entryPlan.entry_price || entryPlan.limit_price;
    const stopLoss = stopPlan.stop || stopPlan.stop_price;
    const takeProfit = signal.take_profit_json?.tp || signal.take_profit_json?.tp_price;

    const baseUrl = Deno.env.get("META_API_BASE_URL") || "https://mt-client-api-v1.new-york.agiliumtrade.ai";

    let actionType = "ORDER_TYPE_BUY";
    const aiOrderType = (signal.order_type || "Market").toUpperCase();
    
    if (aiOrderType.includes("BUY LIMIT")) actionType = "ORDER_TYPE_BUY_LIMIT";
    else if (aiOrderType.includes("SELL LIMIT")) actionType = "ORDER_TYPE_SELL_LIMIT";
    else if (aiOrderType.includes("BUY STOP")) actionType = "ORDER_TYPE_BUY_STOP";
    else if (aiOrderType.includes("SELL STOP")) actionType = "ORDER_TYPE_SELL_STOP";
    else if (signal.side === "LONG") actionType = "ORDER_TYPE_BUY";
    else actionType = "ORDER_TYPE_SELL";

    const executions = [];

    // Route signal to all subscribed users
    for (const user of users) {
      console.log(`[Router] Processing user ${user.user_id}`);

      // 1. Position Sizing
      const riskPerTrade = Number(user.portfolio_capital) * Number(user.risk_per_trade_pct);
      const pointsAtRisk = Math.abs(entryPrice - stopLoss);
      
      let volume = pointsAtRisk > 0 ? riskPerTrade / (pointsAtRisk * 100) : 0.01;
      volume = Math.max(0.01, Math.round(volume * 100) / 100);

      const userRiskAmount = pointsAtRisk * volume * 100;

      // 2. Portfolio Heat Check
      const riskValidation = await validateUserExposure(supabase, user.user_id, userRiskAmount);
      
      if (!riskValidation.valid) {
         console.log(`[Router] User ${user.user_id} rejected: ${riskValidation.reason}`);
         await supabase.from("user_trades").insert({
           user_id: user.user_id,
           opportunity_id: signal.id,
           symbol: signal.symbol,
           side: signal.side,
           volume: volume,
           risk_amount: userRiskAmount,
           status: "REJECTED",
           error_message: riskValidation.reason
         });
         continue;
      }

      // 3. Execution
      let status = "PENDING";
      let error_message = null;
      let meta_api_order_id = null;

      if (user.is_live_execution_enabled && user.meta_api_token && user.meta_api_account_id) {
         const orderPayload: any = {
           actionType: actionType,
           symbol: signal.symbol,
           volume: volume,
           stopLoss: stopLoss,
           takeProfit: takeProfit,
         };

         if (actionType.includes("LIMIT") || actionType.includes("STOP")) {
           orderPayload.openPrice = entryPrice;
         }

         try {
           const metaApiUrl = `${baseUrl}/users/current/accounts/${user.meta_api_account_id}/trade`;
           const response = await fetch(metaApiUrl, {
             method: "POST",
             headers: {
               "auth-token": user.meta_api_token,
               "Content-Type": "application/json",
             },
             body: JSON.stringify(orderPayload),
           });

           if (!response.ok) {
             error_message = await response.text();
             status = "FAILED";
           } else {
             const responseData = await response.json();
             meta_api_order_id = responseData.orderId || "EXECUTED";
             status = "OPEN"; 
           }
         } catch (e: any) {
           error_message = e.message;
           status = "FAILED";
         }
      } else {
         // Paper trading
         status = "PAPER_OPEN";
      }

      // Record the user's trade execution
      await supabase.from("user_trades").insert({
         user_id: user.user_id,
         opportunity_id: signal.id,
         symbol: signal.symbol,
         side: signal.side,
         volume: volume,
         risk_amount: userRiskAmount,
         status: status,
         meta_api_order_id: meta_api_order_id,
         error_message: error_message
      });

      executions.push({ user_id: user.user_id, status });
    }

    return new Response(JSON.stringify({ executions }), { status: 200 });
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
