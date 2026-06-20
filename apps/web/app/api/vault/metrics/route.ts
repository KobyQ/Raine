import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing DB connection' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  try {
    const { data: closedTrades, error } = await supabase
      .from('trade_opportunities')
      .select('status, r_multiple, closed_at')
      .in('status', ['WON', 'LOST'])
      .order('closed_at', { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to fetch trade data' }, { status: 500 });
    }

    if (!closedTrades || closedTrades.length === 0) {
      return NextResponse.json({
        winRate: 0,
        netR: 0,
        expectancy: 0,
        equityCurve: []
      });
    }

    let totalWon = 0;
    let totalLost = 0;
    let netR = 0;
    let sumWinR = 0;
    let sumLossR = 0;

    let cumulativeR = 0;
    const equityCurve = [];

    for (const trade of closedTrades) {
      const r = Number(trade.r_multiple) || 0;
      netR += r;
      cumulativeR += r;

      if (trade.status === 'WON') {
        totalWon++;
        sumWinR += r;
      } else {
        totalLost++;
        sumLossR += r;
      }

      equityCurve.push({
        date: new Date(trade.closed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        cumulative_r: Number(cumulativeR.toFixed(2))
      });
    }

    const totalTrades = totalWon + totalLost;
    const winRate = (totalWon / totalTrades) * 100;
    const lossRate = (totalLost / totalTrades) * 100;

    const avgWinR = totalWon > 0 ? sumWinR / totalWon : 0;
    const avgLossR = totalLost > 0 ? Math.abs(sumLossR / totalLost) : 0;

    const expectancy = (winRate / 100 * avgWinR) - (lossRate / 100 * avgLossR);

    return NextResponse.json({
      winRate: Number(winRate.toFixed(1)),
      netR: Number(netR.toFixed(2)),
      expectancy: Number(expectancy.toFixed(2)),
      equityCurve
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
