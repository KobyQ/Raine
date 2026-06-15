import { EMA, RSI, ADX } from 'technicalindicators';

export type LogicContext = {
  timestamp: string;
  current_price: number;
  ema_50: number | null;
  ema_200: number | null;
  rsi_14: number | null;
  adx_14: number | null;
  trend_alignment: 'BULLISH' | 'BEARISH' | 'CHOP';
};

export function getContextSnapshot(
  timestamps: string[],
  high: number[],
  low: number[],
  close: number[]
): LogicContext {
  // Edge case: Not enough data
  if (close.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      current_price: 0,
      ema_50: null,
      ema_200: null,
      rsi_14: null,
      adx_14: null,
      trend_alignment: 'CHOP',
    };
  }

  const current_price = close[close.length - 1];
  const timestamp = timestamps[timestamps.length - 1] || new Date().toISOString();

  // Calculate indicators
  const ema50 = EMA.calculate({ period: 50, values: close });
  const ema200 = EMA.calculate({ period: 200, values: close });
  const rsi14 = RSI.calculate({ period: 14, values: close });
  
  let adx14: number[] = [];
  try {
    const adxResult = ADX.calculate({ period: 14, high, low, close });
    adx14 = adxResult.map(res => res.adx);
  } catch (e) {
    // technicalindicators ADX might throw if arrays are not equal length or too short
    console.warn("ADX calculation failed:", e);
  }

  const current_ema_50 = ema50.length > 0 ? ema50[ema50.length - 1] : null;
  const current_ema_200 = ema200.length > 0 ? ema200[ema200.length - 1] : null;
  const current_rsi_14 = rsi14.length > 0 ? rsi14[rsi14.length - 1] : null;
  const current_adx_14 = adx14.length > 0 ? adx14[adx14.length - 1] : null;

  // Determine trend alignment
  let trend_alignment: 'BULLISH' | 'BEARISH' | 'CHOP' = 'CHOP';

  if (current_ema_50 !== null && current_ema_200 !== null) {
    if (current_price > current_ema_50 && current_ema_50 > current_ema_200) {
      trend_alignment = 'BULLISH';
    } else if (current_price < current_ema_50 && current_ema_50 < current_ema_200) {
      trend_alignment = 'BEARISH';
    }
  }

  return {
    timestamp,
    current_price,
    ema_50: current_ema_50 ? Number(current_ema_50.toFixed(2)) : null,
    ema_200: current_ema_200 ? Number(current_ema_200.toFixed(2)) : null,
    rsi_14: current_rsi_14 ? Number(current_rsi_14.toFixed(2)) : null,
    adx_14: current_adx_14 ? Number(current_adx_14.toFixed(2)) : null,
    trend_alignment,
  };
}
