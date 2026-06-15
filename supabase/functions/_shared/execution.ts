import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.108.2";
import { insertAuditLog } from "./audit.ts";

export function makeClientOrderId(tradeId: string, n = 1) {
  return `${tradeId}-${n}`;
}

export interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  limitPrice?: number;
  stopPrice?: number;
  tif?: 'day' | 'ioc' | 'fok';
}

async function alpacaFetch(path: string, opts: RequestInit) {
  const base = Deno.env.get('BROKER_BASE_URL') ?? 'https://paper-api.alpaca.markets/v2';
  const headers = {
    'APCA-API-KEY-ID': process.env.BROKER_KEY,
    'APCA-API-SECRET-KEY': process.env.BROKER_SECRET,
    ...(opts.headers ?? {})
  } as Record<string, string>;
  const res = await fetch(`${base}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function placePaperOrder(
  order: OrderRequest,
  supabase?: SupabaseClient,
) {
  const client =
    supabase ||
    (() => {
      const url = Deno.env.get('SUPABASE_URL');
      const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      return url && key ? createClient(url, key) : undefined;
    })();

  if (client) {
    await insertAuditLog(client, {
      actor_type: 'SYSTEM',
      action: 'PLACE_ORDER',
      entity_type: 'order',
      payload_json: order,
    });
  }

  const res = await alpacaFetch('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      type: order.type,
      time_in_force: order.tif ?? 'day',
      limit_price: order.limitPrice,
      stop_price: order.stopPrice,
    }),
  });

  if (client) {
    await insertAuditLog(client, {
      actor_type: 'SYSTEM',
      action: 'ORDER_RESPONSE',
      entity_type: 'order',
      payload_json: res,
    });
  }
  return res;
}

export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export async function fetchPaperBars(symbol: string, timeframe = '1D', limit = 300): Promise<Bar[]> {
  // Route Crypto/Forex/Commodity pairs to Yahoo Finance
  const isForexOrCrypto = symbol === 'XAUUSD' || symbol.includes('USD') || symbol.includes('/');
  
  if (isForexOrCrypto) {
    let yfSymbol = symbol;
    const isCrypto = symbol.startsWith('BTC') || symbol.startsWith('ETH') || symbol.startsWith('SOL');

    if (symbol === 'XAUUSD' || symbol === 'XAU/USD') {
      yfSymbol = 'GC=F'; // Gold Futures as proxy for spot XAUUSD
    } else if (isCrypto && symbol.endsWith('USD')) {
      // BTCUSD -> BTC-USD
      yfSymbol = symbol.replace('USD', '') + '-USD';
    } else if (symbol.includes('/')) {
      yfSymbol = symbol.replace('/', '') + '=X'; // EUR/USD -> EURUSD=X
    } else if (symbol.length === 6 && symbol.endsWith('USD')) {
      yfSymbol = symbol + '=X'; // EURUSD -> EURUSD=X
    }
    
    // Yahoo Finance timeframe mapping
    let yfInterval = '1d';
    let yfRange = '2y';
    if (timeframe === '1D') { yfInterval = '1d'; yfRange = '2y'; }
    if (timeframe === '1H') { yfInterval = '60m'; yfRange = '60d'; }
    if (timeframe === '15Min') { yfInterval = '15m'; yfRange = '60d'; }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=${yfInterval}&range=${yfRange}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Yahoo Finance data error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0];
    
    const bars: Bar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] === null) continue;
      
      const t = new Date(timestamps[i] * 1000).toISOString();
      bars.push({
        t: t,
        o: quote.open[i],
        h: quote.high[i],
        l: quote.low[i],
        c: quote.close[i],
        v: quote.volume[i] || 0
      });
    }
    
    return bars.slice(-limit);
  }

  // Fallback to original Alpaca fetcher for US Stocks
  const base = 'https://data.alpaca.markets/v2';
  const key = Deno.env.get('BROKER_KEY') || Deno.env.get('APCA_API_KEY_ID') || '';
  const secret = Deno.env.get('BROKER_SECRET') || Deno.env.get('APCA_API_SECRET_KEY') || '';
  
  const res = await fetch(
    `${base}/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`,
    {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca data error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.bars ?? [];
}

