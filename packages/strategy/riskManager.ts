import { SupabaseClient } from "@supabase/supabase-js";
import { LogicContext } from "./indicators.ts";

export type RiskValidationResult = {
  valid: boolean;
  reason?: string;
};

// Validates if the central AI is allowed to generate a new signal for this asset
export async function validateGlobalSignal(
  supabase: SupabaseClient,
  symbol: string,
  currentSnapshot?: LogicContext
): Promise<RiskValidationResult> {
  // Fetch active and pending signals
  const { data: activeSignals, error: activeError } = await supabase
    .from("trade_opportunities")
    .select("id, symbol, side, entry_plan_json, stop_plan_json")
    .in("status", ["APPROVED", "PENDING_APPROVAL"]);

  if (activeError) {
    return { valid: false, reason: "Risk Check Failed: Could not query active signals" };
  }

  // Guardrail: Asset Isolation (Don't spam multiple signals for the same asset)
  // Smart Pyramiding Upgrade: Only block if we have an active trade that is NOT significantly in profit.
  if (activeSignals) {
    const activeForSymbol = activeSignals.filter(t => t.symbol === symbol);
    if (activeForSymbol.length > 0) {
      if (activeForSymbol.length >= 2) {
        return { valid: false, reason: `REJECTED: Maximum pyramiding capacity reached (2 trades active for ${symbol}).` };
      }

      if (currentSnapshot && currentSnapshot.current_price && currentSnapshot.atr_14) {
        const existingTrade = activeForSymbol[0];
        const entryPrice = existingTrade.entry_plan_json?.price;
        if (entryPrice) {
          const priceDiff = Math.abs(currentSnapshot.current_price - entryPrice);
          const atr = currentSnapshot.atr_14;
          // If the current price is at least 1 ATR away from the first entry, we consider it "in profit" and allow scaling in
          if (priceDiff > atr) {
            console.log(`[Risk Manager] Pyramiding approved for ${symbol}. Current price is > 1 ATR from original entry.`);
            return { valid: true };
          } else {
            return { valid: false, reason: `REJECTED: Asset isolation enforced. Active trade for ${symbol} is not far enough in profit (needs >1 ATR) to safely scale in.` };
          }
        }
      }
      return { valid: false, reason: `REJECTED: Asset isolation enforced. Signal already active for ${symbol}` };
    }
  }

  return { valid: true };
}

// Validates if a specific user can take a new trade based on their personal heat cap
export async function validateUserExposure(
  supabase: SupabaseClient,
  userId: string,
  newRiskAmount: number
): Promise<RiskValidationResult> {
  // Fetch user's active trades to calculate current heat
  const { data: userTrades, error: tradesError } = await supabase
    .from("user_trades")
    .select("risk_amount")
    .in("status", ["OPEN", "PENDING"]);

  if (tradesError) {
    return { valid: false, reason: "Failed to query user trades" };
  }

  // Fetch user's risk settings
  const { data: settings, error: settingsError } = await supabase
    .from("user_risk_settings")
    .select("portfolio_capital, max_portfolio_heat_pct")
    .eq("user_id", userId)
    .single();

  if (settingsError || !settings) {
    return { valid: false, reason: "User risk settings not found" };
  }

  let currentHeat = 0;
  if (userTrades) {
    currentHeat = userTrades.reduce((sum, trade) => sum + Number(trade.risk_amount), 0);
  }

  const maxHeat = Number(settings.portfolio_capital) * Number(settings.max_portfolio_heat_pct);

  if ((currentHeat + newRiskAmount) > maxHeat) {
    return { valid: false, reason: `REJECTED: Portfolio Heat limit (${Number(settings.max_portfolio_heat_pct) * 100}%) exceeded.` };
  }

  return { valid: true };
}

