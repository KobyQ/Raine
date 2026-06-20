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

async function evaluateOpportunity(symbol: string, snapshot: LogicContext, timeframe: string) {
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

  const systemPrompt = `You are a Senior Risk Officer for an institutional trading desk. You respond EXCLUSIVELY in raw JSON.

[CRITICAL OUTPUT RULE]
You MUST respond strictly with a raw JSON object matching the exact schema below. Do not include any markdown formatting (like \`\`\`json), wrapper text, HTML tags, or conversational preambles. If you include anything other than raw JSON, the system breaks.

{
  "setup_valid": boolean,
  "action": "APPROVED" | "REJECTED",
  "execution_parameters": {
    "entry_type": "Buy Limit" | "Sell Limit" | "Buy Stop" | "Sell Stop" | "NONE",
    "suggested_entry_price": number | null,
    "suggested_stop_loss": number | null
  },
  "confidence_score": number,
  "institutional_rationale": {
    "timeframe_context": "Explain how the timeframe impacts the weight of the RSI and setup.",
    "key_levels": "Define structural boundaries, nearest support/resistance.",
    "intermarket_context": "Specify EXACT macro correlations relevant to the asset class.",
    "if_then_scenario": "Map out exactly what price action would create/invalidate a valid entry.",
    "confluence_check": "Evaluate moving averages and volume against the RSI. (Mandatory)"
  },
  "alternative_setup": {
    "direction_suggested": "LONG" | "SHORT" | "NONE",
    "entry_type": "Buy Limit" | "Sell Limit" | "Buy Stop" | "Sell Stop" | "NONE",
    "suggested_entry_price": number | null,
    "suggested_stop_loss": number | null,
    "pivot_rationale": "Explain why a counter-trade works, OR explicitly explain why BOTH long and short are currently untradeable due to structural 'empty air'."
  }
}

[RISK EVALUATION RULES]
1. PULLBACK setups (BULLISH_PULLBACK or BEARISH_PULLBACK) are your preferred swing trade entries.
   - For a Pullback LONG, your entry price MUST be logically placed near structural support. Do not leave a massive gap of "empty air" between your entry and the nearest support.
   - For a Pullback SHORT, your entry price MUST be logically placed near structural resistance.
2. TREND breakouts (BULLISH_TREND or BEARISH_TREND) are accepted only if RSI is not over-extended.
3. STOP LOSS LOGIC: The snapshot provides \`safe_long_stop_loss\` and \`safe_short_stop_loss\`. 
   - If analyzing a short timeframe (e.g., 30min, 1H) and the safe boundary represents a massive move (e.g. >1.5% away), you MUST REJECT the setup entirely due to a "structural timeframe mismatch".
4. FUNDAMENTAL REALITY CHECK: If \`fundamental_context\` is missing, null, or 'No fundamental news provided.', base your decision purely on technicals.
   - If fundamental reality is BEARISH, REJECT any LONG setups. If BULLISH, REJECT any SHORT setups.
5. COUNTER-TREND MOMENTUM CHECK: Do not blindly buy assets that are crashing well below both the 50 EMA and 200 EMA just because RSI is low. REJECT long setups if the asset is in heavy bearish momentum unless price is within 0.1% to 0.25% of a major, higher-timeframe support level.
6. THE PIVOT RULE: If you REJECT a LONG setup because the asset is in heavy bearish momentum (Rule 5), you MUST immediately evaluate if a valid SHORT setup exists. If current price is also too far from resistance to safely short, you MUST set "direction_suggested" to "NONE" and explain why in the "pivot_rationale".

Current Market Context:
\${JSON.stringify(snapshot, null, 2)}`;

  const direction = snapshot.trend_alignment.startsWith('BULLISH') ? 'LONG (BUY)' : 'SHORT (SELL)';
  const userPrompt = `Evaluate the ${snapshot.trend_alignment} setup for ${symbol} on the ${timeframe} timeframe at current price ${snapshot.current_price} for a potential ${direction} position. Return the required JSON object execution profile.`;

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
            action: { type: "string", enum: ["APPROVED", "REJECTED"] },
            execution_parameters: {
              type: "object",
              properties: {
                entry_type: { type: "string", enum: ["Buy Limit", "Sell Limit", "Buy Stop", "Sell Stop", "NONE"] },
                suggested_entry_price: { type: ["number", "null"] },
                suggested_stop_loss: { type: ["number", "null"] }
              },
              required: ["entry_type", "suggested_entry_price", "suggested_stop_loss"],
              additionalProperties: false
            },
            confidence_score: { type: "number" },
            institutional_rationale: {
              type: "object",
              properties: {
                timeframe_context: { type: "string" },
                key_levels: { type: "string" },
                intermarket_context: { type: "string" },
                if_then_scenario: { type: "string" },
                confluence_check: { type: "string" }
              },
              required: ["timeframe_context", "key_levels", "intermarket_context", "if_then_scenario", "confluence_check"],
              additionalProperties: false
            },
            alternative_setup: {
              type: "object",
              properties: {
                direction_suggested: { type: "string", enum: ["LONG", "SHORT", "NONE"] },
                entry_type: { type: "string", enum: ["Buy Limit", "Sell Limit", "Buy Stop", "Sell Stop", "NONE"] },
                suggested_entry_price: { type: ["number", "null"] },
                suggested_stop_loss: { type: ["number", "null"] },
                pivot_rationale: { type: "string" }
              },
              required: ["direction_suggested", "entry_type", "suggested_entry_price", "suggested_stop_loss", "pivot_rationale"],
              additionalProperties: false
            }
          },
          required: ["setup_valid", "action", "execution_parameters", "confidence_score", "institutional_rationale", "alternative_setup"],
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
serve((req) => {
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get("timeframe") ?? "1D";
  const modelId = searchParams.get("model_id") ?? undefined;
  const modelVersion = searchParams.get("model_version") ?? undefined;
  const newsContext = searchParams.get("news") ?? undefined;
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

  const body = new ReadableStream({
    async start(controller) {
      function sendEvent(data: any) {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          console.error("Stream closed", e);
        }
      }

      const results: any[] = [];
      const rejections: any[] = [];
      
      try {
        console.log(`[Research Run] Starting pipeline for symbols: ${symbols.join(", ")}`);
        sendEvent({ type: 'progress', message: `Starting analysis pipeline for: ${symbols.join(", ")}` });
        
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
              sendEvent({ type: 'progress', message: `[Data Fetch] Fetching historical price data for ${symbol}...` });
              bars = await fetchPaperBars(symbol, timeframe);
            } catch (err: any) {
              console.error(`[Data Fetch Error] Failed to fetch data for ${symbol}: ${err.message}`);
              await insertAuditLog(supabase, {
                actor_type: "SYSTEM",
                action: "API_TIMEOUT",
                entity_type: "research",
                payload_json: { symbol, reason: "Market data fetch failed", error: err.message },
              });
              rejections.push({
                symbol,
                reason: `Data Fetch Error: ${err.message}`,
                layer: "Data"
              });
              continue;
            }
            
            console.log(`\n[Info] [Data Fetch] Successfully fetched ${bars.length} bars for ${symbol}.`);
            sendEvent({ type: 'progress', message: `[Data Fetch] Successfully acquired ${bars.length} data points.` });

            // Store fetched bars in PTI database asynchronously
            saveBars(supabase, symbol, timeframe, bars).catch(err => 
              console.error(`[Error] Failed to save bars for ${symbol}:`, err)
            );

            // LAYER A: Deterministic Evaluation Guard
            sendEvent({ type: 'progress', message: `[Layer A: Deterministic Guard] Evaluating mathematical momentum and regime...` });
            const rawSnapshot = getContextSnapshot(
              bars.map((b) => b.t),
              bars.map((b) => b.h),
              bars.map((b) => b.l),
              bars.map((b) => b.c)
            );
            
            // Inject macro context if provided via URL params
            const snapshot = {
              ...rawSnapshot,
              fundamental_context: newsContext || "No fundamental news provided."
            };

            console.log(`[Strategy Eval] Market snapshot for ${symbol}: Trend=${snapshot.trend_alignment}, RSI=${snapshot.rsi_14.toFixed(2)}, CurrentPrice=${snapshot.current_price}`);
            
            // LAYER A: Deterministic Guard
            if (snapshot.trend_alignment === 'CHOP') {
              console.log(`[Layer A: Deterministic Guard] REJECTED ${symbol}: Market is in CHOP regime. No clear trend.`);
              sendEvent({ type: 'progress', message: `[Layer A: Deterministic Guard] REJECTED ${symbol}: Market is in CHOP regime.` });
              await insertAuditLog(supabase, {
                actor_type: "SYSTEM",
                action: "RESEARCH_HALTED",
                entity_type: "research",
                payload_json: { symbol, reason: "CHOP_REGIME", context: snapshot },
              });
              rejections.push({
                symbol,
                reason: "Deterministic Guard: Market is in CHOP regime. No clear trend.",
                layer: "A"
              });
              continue;
            }

            // LAYER B: Cognitive Guard (Senior Risk Officer)
            let evaluation;
            try {
              console.log(`[Layer B: Cognitive Guard] Requesting AI evaluation for ${symbol}...`);
              sendEvent({ type: 'progress', message: `[Layer B: AI Risk Officer] Evaluating institutional rationale and key levels for ${snapshot.trend_alignment} setup...` });
              evaluation = await evaluateOpportunity(symbol, snapshot, timeframe);
            } catch (err: any) {
              console.error(`[Layer B Error] AI evaluation failed for ${symbol}: ${err.message}`);
              sendEvent({ type: 'progress', message: `[Layer B: AI Risk Officer] Evaluation failed: ${err.message}` });
              await insertAuditLog(supabase, {
                actor_type: "SYSTEM",
                action: "API_TIMEOUT",
                entity_type: "research",
                payload_json: { symbol, reason: "OpenAI evaluation failed or timed out", error: err.message },
              });
              rejections.push({
                symbol,
                reason: `AI Evaluation Error: ${err.message}`,
                layer: "B"
              });
              continue;
            }

            const is_valid = evaluation.setup_valid && evaluation.action !== "REJECTED";
            
            const dbSide = snapshot.trend_alignment.startsWith('BULLISH') ? 'LONG' : 'SHORT';
            const entry_price = evaluation.execution_parameters?.suggested_entry_price || snapshot.current_price;
            const stop_loss = evaluation.execution_parameters?.suggested_stop_loss || (dbSide === "LONG" ? snapshot.safe_long_stop_loss : snapshot.safe_short_stop_loss);
            const confidence_score = evaluation.confidence_score || 50;
            
            const rationaleObj = evaluation.institutional_rationale || {};
            const institutional_rationale = [
              rationaleObj.timeframe_context,
              rationaleObj.key_levels,
              rationaleObj.intermarket_context,
              rationaleObj.if_then_scenario,
              rationaleObj.confluence_check
            ].filter(Boolean).join(" ");

            console.log(`[Layer B: Cognitive Guard] AI Response for ${symbol}: Valid Setup = ${is_valid}`);
            console.log(`[Layer B] AI Rationale: ${institutional_rationale}`);

            if (!is_valid) {
              console.log(`[Layer B: Cognitive Guard] REJECTED ${symbol} by AI Risk Officer.`);
              sendEvent({ type: 'progress', message: `[Layer B: AI Risk Officer] REJECTED ${symbol} based on institutional logic.` });
              await insertAuditLog(supabase, {
                actor_type: "SYSTEM",
                action: "REJECTED_BY_AI",
                entity_type: "research",
                payload_json: { symbol, reason: institutional_rationale, context: snapshot },
              });
              rejections.push({
                symbol,
                reason: institutional_rationale,
                layer: "Cognitive AI"
              });
              continue;
            }

            console.log(`[Layer B: Cognitive Guard] APPROVED ${symbol} by AI Risk Officer.`);
            sendEvent({ type: 'progress', message: `[Layer B: Cognitive Guard] APPROVED by AI Risk Officer.` });

            // LAYER C: Risk Manager (The Kill Switch)
            sendEvent({ type: 'progress', message: `[Layer C: Risk Manager] Validating exposure and portfolio allocation...` });
            const riskValidation = await validateExposure(supabase, symbol);

            // LAYER C: Deterministic Risk/Reward Math (Force exactly 1:2 R:R)
            const risk = Math.abs(entry_price - stop_loss);
            const take_profit = dbSide === 'LONG' ? entry_price + (risk * 2) : entry_price - (risk * 2);

            const qty = 100;
            const commission = 0.01;
            const slippageBps = 5;
            const grossEdge = dbSide === 'LONG' ? take_profit - entry_price : entry_price - take_profit;
            const txCost = transactionCost(qty, commission);
            const slip = slippage(entry_price, qty, slippageBps);
            const net = netEdge(grossEdge, entry_price, qty, commission, slippageBps);
            
            const riskAmount = Math.abs(entry_price - stop_loss) * qty;
            const expectedReturn = Math.abs(take_profit - entry_price) * qty;
            const rrRatio = riskAmount > 0 ? expectedReturn / riskAmount : 0;
            const expectedReturnPct = expectedReturn / entry_price;
            
            const stopLossPercentage = risk / entry_price;
            let maxAllowedRiskPct = 0.05; // 5% default for macro
            if (timeframe.toLowerCase().includes("min") || timeframe.toLowerCase().includes("h")) {
              maxAllowedRiskPct = 0.015; // 1.5% max for intraday
            }

            if (stopLossPercentage > maxAllowedRiskPct) {
              console.log(`[Layer C: Execution Desk] REJECTED ${symbol}: Stop loss percentage (${(stopLossPercentage*100).toFixed(2)}%) exceeds allowed maximum of ${(maxAllowedRiskPct*100).toFixed(2)}% for timeframe ${timeframe}.`);
              sendEvent({ type: 'progress', message: `[Layer C: Execution Desk] REJECTED: Structural mismatch. Stop loss (${(stopLossPercentage*100).toFixed(2)}%) too wide for ${timeframe}.` });
              rejections.push({
                symbol,
                reason: `Structural timeframe mismatch: A stop loss of ${(stopLossPercentage*100).toFixed(2)}% is too wide for an intraday timeframe (${timeframe}). Max allowed is ${(maxAllowedRiskPct*100).toFixed(2)}%.`,
                layer: "Execution Desk"
              });
              continue;
            }

            if (!riskValidation.valid) {
              console.log(`[Layer C: Risk Manager] REJECTED ${symbol}: ${riskValidation.reason}`);
              sendEvent({ type: 'progress', message: `[Layer C: Risk Manager] REJECTED ${symbol}: Exposure constraints violated.` });
              await insertAuditLog(supabase, {
                actor_type: "SYSTEM",
                action: "REJECTED_BY_RISK",
                entity_type: "research",
                payload_json: { symbol, reason: riskValidation.reason, context: snapshot },
              });

              await supabase.from("trade_opportunities").insert({
                symbol,
                side: dbSide,
                timeframe: timeframe.toLowerCase(),
                status: "REJECTED",
                entry_plan_json: { price: entry_price, transaction_cost: txCost, slippage: slip, net_edge: net },
                stop_plan_json: { stop: stop_loss },
                take_profit_json: { tp: take_profit },
                risk_summary: riskValidation.reason,
                expected_return: expectedReturnPct,
                confidence: confidence_score,
                ai_summary: institutional_rationale,
                ai_risks: "REJECTED BY RISK DESK",
                model_id: modelId,
                model_version: modelVersion,
              });
              rejections.push({
                symbol,
                reason: riskValidation.reason,
                rationale: institutional_rationale,
                layer: "Risk Manager"
              });
              continue;
            }

            console.log(`\n[Info] [Layer C: Execution Desk] Validating risk parameters for ${symbol}...`);
            sendEvent({ type: 'progress', message: `[Layer C: Execution Desk] Validating risk parameters for ${symbol}...` });
            
            if (rrRatio < 1.9) {
              console.log(`[Layer C: Execution Desk] REJECTED ${symbol}: R/R Ratio too low (${rrRatio.toFixed(2)}). Minimum 2.0 required.`);
              sendEvent({ type: 'progress', message: `[Layer C: Execution Desk] REJECTED: R/R Ratio too low (${rrRatio.toFixed(2)}).` });
              rejections.push({
                symbol,
                reason: `Risk/Reward ratio ${rrRatio.toFixed(2)} is below institutional minimum of 2.0`,
                layer: "Execution Desk"
              });
              continue;
            }

            console.log(`[Layer C: Execution Desk] APPROVED ${symbol}: Generating pending opportunity...`);
            sendEvent({ type: 'progress', message: `[Execution] Creating opportunity for ${symbol}...` });
            const { data, error } = await supabase
              .from("trade_opportunities")
              .insert({
                symbol,
                side: dbSide,
                timeframe: timeframe.toLowerCase(),
                status: "PENDING_APPROVAL",
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
              sendEvent({ type: 'progress', message: `[Success] Opportunity generated for ${symbol}` });
              
              const expected_loss = Math.abs(entry_price - stop_loss) * qty;
              const expected_profit = Math.abs(take_profit - entry_price) * qty;

              let order_type = dbSide === 'LONG' ? 'BUY MARKET' : 'SELL MARKET';
              if (Math.abs(entry_price - snapshot.current_price) / snapshot.current_price > 0.0005) {
                  if (dbSide === 'LONG') {
                      order_type = entry_price < snapshot.current_price ? 'BUY LIMIT' : 'BUY STOP';
                  } else {
                      order_type = entry_price > snapshot.current_price ? 'SELL LIMIT' : 'SELL STOP';
                  }
              }

              results.push({ 
                symbol, 
                id: data.id,
                order_type,
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
              sendEvent({ type: 'progress', message: `[Database Error] ${error.message}` });
            }
          } catch (globalErr: any) {
            console.error(`[Global Error] Unexpected error processing ${symbol}: ${globalErr.message}`);
            sendEvent({ type: 'progress', message: `[System Error] ${globalErr.message}` });
            rejections.push({
              symbol,
              reason: `System Error: ${globalErr.message}`,
              layer: "System"
            });
            continue;
          }
        }

        sendEvent({ type: 'complete', opportunities: results, rejections });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    },
  });
});