import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { insertAuditLog } from "../_shared/audit.ts";

serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Supabase env vars" }), { status: 500 });
  }
  
  const supabase = createClient(url, key);

  // 1. Fetch active signals
  const { data: openSignals, error: fetchError } = await supabase
    .from("trade_opportunities")
    .select("*")
    .eq("status", "APPROVED");

  if (fetchError || !openSignals || openSignals.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: "No active signals to evaluate" }), { status: 200 });
  }

  const results = [];

  // 2. The Price Action Check (The Simulator)
  for (const signal of openSignals) {
    const { symbol, side, timeframe, created_at, entry_plan_json, stop_plan_json, take_profit_json } = signal;
    
    // Safety check
    if (!entry_plan_json?.price || !stop_plan_json?.stop || !take_profit_json?.tp) {
      continue;
    }
    
    const stopLoss = stop_plan_json.stop;
    const takeProfit = take_profit_json.tp;

    // Fetch subsequent candles for this symbol from market_data_pti
    const { data: candles } = await supabase
      .from("market_data_pti")
      .select("ts, h, l")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .gt("ts", created_at)
      .order("ts", { ascending: true });

    if (!candles || candles.length === 0) {
      continue; // No new market data yet
    }

    let outcome: 'WON' | 'LOST' | null = null;
    let rMultiple = 0;
    let closedAt = null;

    for (const candle of candles) {
      if (side === 'BULLISH' || side === 'LONG') {
        // Did the candle hit SL?
        if (candle.l <= stopLoss) {
          outcome = 'LOST';
          rMultiple = -1.0;
          closedAt = candle.ts;
          break; // Stop evaluating
        }
        // Did the candle hit TP?
        else if (candle.h >= takeProfit) {
          outcome = 'WON';
          rMultiple = 2.0; // Enforcing 1:2 strict R/R baseline
          closedAt = candle.ts;
          break;
        }
      } else if (side === 'BEARISH' || side === 'SHORT') {
        // Did the candle hit SL?
        if (candle.h >= stopLoss) {
          outcome = 'LOST';
          rMultiple = -1.0;
          closedAt = candle.ts;
          break;
        }
        // Did the candle hit TP?
        else if (candle.l <= takeProfit) {
          outcome = 'WON';
          rMultiple = 2.0;
          closedAt = candle.ts;
          break;
        }
      }
    }

    // 3. The Ledger Update
    if (outcome) {
      const { error: updateError } = await supabase
        .from("trade_opportunities")
        .update({
          status: outcome,
          r_multiple: rMultiple,
          closed_at: closedAt
        })
        .eq("id", signal.id);

      if (!updateError) {
        results.push({ id: signal.id, outcome, rMultiple });
        
        await insertAuditLog(supabase, {
          actor_type: "SYSTEM",
          action: "OUTCOME_RESOLVED",
          entity_type: "trade_opportunity",
          entity_id: signal.id,
          payload_json: { outcome, r_multiple: rMultiple, closed_at: closedAt }
        });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, resolved: results }), { headers: { "content-type": "application/json" } });
});
