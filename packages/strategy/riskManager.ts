import { SupabaseClient } from "@supabase/supabase-js";

export type RiskValidationResult = {
  valid: boolean;
  reason?: string;
};

export async function validateExposure(
  supabase: SupabaseClient,
  symbol: string
): Promise<RiskValidationResult> {
  // 1. Fetch active trades (status = APPROVED)
  const { data: openTrades, error: openError } = await supabase
    .from("trade_opportunities")
    .select("symbol")
    .eq("status", "APPROVED");

  if (openError) {
    return { valid: false, reason: "Risk Check Failed: Could not query open trades" };
  }

  // Guardrail 1: Max Open Trades (Max 2)
  if (openTrades && openTrades.length >= 2) {
    return { valid: false, reason: "REJECTED: Max global active trades (2) reached" };
  }

  // Guardrail 2: Asset Isolation
  if (openTrades && openTrades.some(t => t.symbol === symbol)) {
    return { valid: false, reason: `REJECTED: Asset isolation enforced. Position already open for ${symbol}` };
  }

  // Guardrail 3: Daily Cooldown (Max 2 consecutive losses today)
  // Calculate Start of Day (UTC)
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

  const { data: recentClosedTrades, error: closedError } = await supabase
    .from("trade_opportunities")
    .select("status")
    .in("status", ["WON", "LOST"])
    .gte("closed_at", startOfDay.toISOString())
    .order("closed_at", { ascending: false })
    .limit(2);

  if (closedError) {
    return { valid: false, reason: "Risk Check Failed: Could not query recent closed trades" };
  }

  if (recentClosedTrades && recentClosedTrades.length === 2) {
    const bothLost = recentClosedTrades.every(t => t.status === "LOST");
    if (bothLost) {
      return { valid: false, reason: "REJECTED: Daily Cooldown Active (2 consecutive losses today)" };
    }
  }

  return { valid: true };
}
