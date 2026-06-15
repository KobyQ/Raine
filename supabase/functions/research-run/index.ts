import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.108.2";
import { fetchPaperBars, Bar } from "../_shared/execution.ts";
import { sma, rsi, detectRegime } from "../_shared/strategy.ts";
import { insertAuditLog } from "../_shared/audit.ts";
import { netEdge, transactionCost, slippage } from "../../../packages/strategy/index.ts";
import { getContextSnapshot, LogicContext } from "../../../packages/strategy/indicators.ts";
import { validateExposure } from "../../../packages/strategy/riskManager.ts";
import OpenAI from "npm:openai";

async function hashBar(b: Bar) {
  const str = `${b.t}|${b.o}|${b.h}|${b.l}|${b.c}|${b.v}`;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str),
  );
  return Array.from(new Uint8Array(buf))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}

async function saveBars(
  supabase: SupabaseClient,
  symbol: string,
  timeframe: string,
  bars: Bar[],
) {
  for (const b of bars) {
    const hash = await hashBar(b);
    const { data: existing } = await supabase
      .from("market_data_pti")
      .select("hash, revision")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe.toLowerCase())
      .eq("ts", b.t)
      .order("revision", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.hash === hash) continue;

    const revision = existing ? existing.revision + 1 : 0;
    await supabase.from("market_data_pti").insert({
      symbol,
      timeframe: timeframe.toLowerCase(),
      ts: b.t,
      o: b.o,
      h: b.h,
      l: b.l,
      c: b.c,
      v: b.v,
      revision,
      hash,
    });
  }
}

async function evaluateOpportunity(symbol: string, snapshot: LogicContext) {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const azureKey = Deno.env.get("AZURE_OPENAI_API_KEY");
  
  let openai: OpenAI;
  if (openaiKey) {
    openai = new OpenAI({ apiKey: openaiKey });
  } else if (azureKey) {
    openai = new OpenAI({
      apiKey: azureKey,
      baseURL: `${Deno.env.get("AZURE_OPENAI_ENDPOINT")}/openai/deployments/${Deno.env.get("AZURE_OPENAI_DEPLOYMENT")}`,
      defaultQuery: { "api-version": Deno.env.get("AZURE_OPENAI_API_VERSION") || "2023-07-01-preview" },
      defaultHeaders: { "api-key": azureKey }
    });
  } else {
    throw new Error("No OpenAI or Azure OpenAI keys found");
  }

  const systemPrompt = `You are a Senior Risk Officer for an institutional trading desk.
You evaluate mathematically valid setups based on strictly defined rules.

RULES:
1. PULLBACK setups (BULLISH_PULLBACK or BEARISH_PULLBACK) are your preferred swing trade entries.
2. If it is a TREND setup (BULLISH_TREND or BEARISH_TREND), ensure the RSI is not over-extended. If extended, reject the trade.
3. Risk/Reward must be at least 1:2.
4. For LONG trades, place the Stop Loss just below the recent swing low. For SHORT trades, place it just above the recent swing high.

Current Market Context:
${JSON.stringify(snapshot, null, 2)}`;

  const userPrompt = `Evaluate the ${snapshot.trend_alignment} setup for ${symbol} at price ${snapshot.current_price}. Provide the execution parameters and rationale.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "trade_evaluation",
        schema: {
          type: "object",
          properties: {
            setup_valid: { type: "boolean" },
            entry_price: { type: "number" },
            stop_loss: { type: "number" },
            take_profit: { type: "number" },
            confidence_score: { type: "number" },
            institutional_rationale: { type: "string" }
          },
          required: ["setup_valid", "entry_price", "stop_loss", "take_profit", "confidence_score", "institutional_rationale"],
          additionalProperties: false
        },
        strict: true
      }
    },
    temperature: 0.1
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content returned from AI");
  
  return JSON.parse(content);
}

/**
 * Research run generates simple trade opportunities for one or more symbols.
 *
 * Query parameters:
 * - `symbols`   Comma-separated stock symbols (default AAPL)
 * - `timeframe` 1D or 1H (default 1D)
 * - `model_id`  Optional model identifier (for audit)
 * - `model_version` Optional model version (for audit)
 */
serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get("timeframe") ?? "1D";
  const modelId = searchParams.get("model_id") ?? undefined;
  const modelVersion = searchParams.get("model_version") ?? undefined;
  const symbolsParam =
    searchParams.get("symbols") ?? Deno.env.get("RESEARCH_SYMBOLS") ?? "AAPL";
  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing env" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${key}` } },
  });

  const results: any[] = [];
  console.log(`[Research Run] Starting pipeline for symbols: ${symbols.join(", ")}`);
  for (const symbol of symbols) {
    try {
      await insertAuditLog(supabase, {
        actor_type: "SYSTEM",
        action: "RESEARCH_RUN",
        entity_type: "research",
        payload_json: { symbol, timeframe, model_id: modelId, model_version: modelVersion },
      });

      let bars: Bar[];
      try {
        console.log(`[Data Fetch] Fetching market data for ${symbol}...`);
        bars = await fetchPaperBars(symbol, timeframe);
      } catch (err: any) {
        console.error(`[Data Fetch Error] Failed to fetch data for ${symbol}: ${err.message}`);
        await insertAuditLog(supabase, {
          actor_type: "SYSTEM",
          action: "API_TIMEOUT",
          entity_type: "research",
          payload_json: { symbol, reason: "Market data fetch failed", error: err.message },
        });
        continue;
      }
      if (!bars || !bars.length) {
        console.log(`[Data Fetch] No bars returned for ${symbol}. Skipping.`);
        continue;
      }
      console.log(`[Data Fetch] Successfully fetched ${bars.length} bars for ${symbol}.`);

      await saveBars(supabase, symbol, timeframe, bars);
      await insertAuditLog(supabase, {
        actor_type: "SYSTEM",
        action: "MARKET_DATA_SAVED",
        entity_type: "market_data",
        payload_json: { symbol, timeframe, count: bars.length },
      });

      const closes = bars.map((b) => b.c);
      const highs = bars.map((b) => b.h);
      const lows = bars.map((b) => b.l);
      const timestamps = bars.map((b) => b.t);

      const snapshot = getContextSnapshot(timestamps, highs, lows, closes);
      console.log(`[Strategy Eval] Market snapshot for ${symbol}: Trend=${snapshot.trend_alignment}, RSI=${snapshot.rsi_14.toFixed(2)}, CurrentPrice=${snapshot.current_price}`);
      
      // LAYER A: Deterministic Guard
      if (snapshot.trend_alignment === 'CHOP') {
        console.log(`[Layer A: Deterministic Guard] REJECTED ${symbol}: Market is in CHOP regime. No clear trend.`);
        await insertAuditLog(supabase, {
          actor_type: "SYSTEM",
          action: "RESEARCH_HALTED",
          entity_type: "research",
          payload_json: { symbol, reason: "CHOP_REGIME", context: snapshot },
        });
        continue;
      }

      // LAYER B: Cognitive Guard (Senior Risk Officer)
      let evaluation;
      try {
        console.log(`[Layer B: Cognitive Guard] Requesting AI evaluation for ${symbol}...`);
        evaluation = await evaluateOpportunity(symbol, snapshot);
      } catch (err: any) {
        console.error(`[Layer B Error] AI evaluation failed for ${symbol}: ${err.message}`);
        await insertAuditLog(supabase, {
          actor_type: "SYSTEM",
          action: "API_TIMEOUT",
          entity_type: "research",
          payload_json: { symbol, reason: "OpenAI evaluation failed or timed out", error: err.message },
        });
        continue;
      }

      console.log(`[Layer B: Cognitive Guard] AI Response for ${symbol}: Valid Setup = ${evaluation.setup_valid}`);
      console.log(`[Layer B] AI Rationale: ${evaluation.institutional_rationale}`);

      if (!evaluation.setup_valid) {
        console.log(`[Layer B: Cognitive Guard] REJECTED ${symbol} by AI Risk Officer.`);
        await insertAuditLog(supabase, {
          actor_type: "SYSTEM",
          action: "REJECTED_BY_AI",
          entity_type: "research",
          payload_json: { symbol, reason: evaluation.institutional_rationale, context: snapshot },
        });
        continue;
      }

      // LAYER C: Risk Manager (The Kill Switch)
      const riskValidation = await validateExposure(supabase, symbol);

      const { entry_price, stop_loss, take_profit, confidence_score, institutional_rationale } = evaluation;

      const qty = 1;
      const commission = 0.01;
      const slippageBps = 5;
      const dbSide = snapshot.trend_alignment.startsWith('BULLISH') ? 'LONG' : 'SHORT';
      const grossEdge = dbSide === 'LONG' ? take_profit - entry_price : entry_price - take_profit;
      const txCost = transactionCost(qty, commission);
      const slip = slippage(entry_price, qty, slippageBps);
      const net = netEdge(grossEdge, entry_price, qty, commission, slippageBps);
      const expectedReturn = net / entry_price;

      if (!riskValidation.valid) {
        console.log(`[Layer C: Risk Manager] REJECTED ${symbol}: ${riskValidation.reason}`);
        await insertAuditLog(supabase, {
          actor_type: "SYSTEM",
          action: "REJECTED_BY_RISK",
          entity_type: "research",
          payload_json: { symbol, reason: riskValidation.reason, context: snapshot },
        });

        // Save as REJECTED
        await supabase.from("trade_opportunities").insert({
          symbol,
          side: dbSide,
          timeframe: timeframe.toLowerCase(),
          status: "REJECTED",
          entry_plan_json: { price: entry_price, transaction_cost: txCost, slippage: slip, net_edge: net },
          stop_plan_json: { stop: stop_loss },
          take_profit_json: { tp: take_profit },
          risk_summary: riskValidation.reason,
          expected_return: expectedReturn,
          confidence: confidence_score,
          ai_summary: institutional_rationale,
          ai_risks: "REJECTED BY RISK DESK",
          model_id: modelId,
          model_version: modelVersion,
        });
        continue;
      }

      // Persist to Ledger (APPROVED)
      const { data, error } = await supabase
        .from("trade_opportunities")
        .insert({
          symbol,
          side: dbSide,
          timeframe: timeframe.toLowerCase(),
          status: "APPROVED",
          entry_plan_json: {
            price: entry_price,
            transaction_cost: txCost,
            slippage: slip,
            net_edge: net,
          },
          stop_plan_json: { stop: stop_loss },
          take_profit_json: { tp: take_profit },
          risk_summary: `RSI ${snapshot.rsi_14}`,
          expected_return: expectedReturn,
          confidence: confidence_score,
          ai_summary: institutional_rationale,
          ai_risks: "Managed by AI Risk Officer",
          model_id: modelId,
          model_version: modelVersion,
        })
        .select("id")
        .single();

      if (!error && data) {
        console.log(`[Success] Opportunity generated for ${symbol}: ID ${data.id}`);
        const expected_loss = Math.abs(entry_price - stop_loss) * qty;
        const expected_profit = Math.abs(take_profit - entry_price) * qty;

        results.push({ 
          symbol, 
          id: data.id,
          entry_price,
          take_profit,
          stop_loss,
          expected_loss,
          expected_profit
        });

        await insertAuditLog(supabase, {
          actor_type: "SYSTEM",
          action: "OPPORTUNITY_CREATED",
          entity_type: "trade_opportunity",
          entity_id: data.id,
          payload_json: { symbol, timeframe, model_id: modelId, model_version: modelVersion },
        });
      } else if (error) {
        console.error(`[Database Error] Failed to insert opportunity for ${symbol}: ${error.message}`);
      }
    } catch (globalErr: any) {
      console.error(`[Global Error] Unexpected error processing ${symbol}: ${globalErr.message}`);
      continue;
    }
  }

  return new Response(JSON.stringify({ ok: true, opportunities: results }), {
    headers: { "content-type": "application/json" },
  });
});