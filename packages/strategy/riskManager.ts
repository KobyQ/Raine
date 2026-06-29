import { SupabaseClient } from "@supabase/supabase-js";

export type RiskValidationResult = {
  valid: boolean;
  reason?: string;
};

// Validates if the central AI is allowed to generate a new signal for this asset
export async function validateGlobalSignal(
  supabase: SupabaseClient,
  symbol: string
): Promise<RiskValidationResult> {
  // Fetch active and pending signals
  const { data: activeSignals, error: activeError } = await supabase
    .from("trade_opportunities")
    .select("symbol")
    .in("status", ["APPROVED", "PENDING_APPROVAL"]);

  if (activeError) {
    return { valid: false, reason: "Risk Check Failed: Could not query active signals" };
  }

  // Guardrail: Asset Isolation (Don't spam multiple signals for the same asset)
  if (activeSignals && activeSignals.some(t => t.symbol === symbol)) {
    return { valid: false, reason: `REJECTED: Asset isolation enforced. Signal already active for ${symbol}` };
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

