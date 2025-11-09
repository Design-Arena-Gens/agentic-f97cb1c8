import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Candle } from '@/lib/types';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  symbol: z.string().default('^NSEI'),
  range: z.enum(['1d', '5d', '1mo']).default('5d'),
  interval: z.enum(['1m', '5m', '15m', '30m', '60m']).default('5m'),
});

function toCandles(json: any): Candle[] {
  const result = json?.chart?.result?.[0];
  if (!result) return [];
  const ts: number[] = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] ?? {};
  const { open = [], high = [], low = [], close = [], volume = [] } = quotes;

  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = open[i];
    const h = high[i];
    const l = low[i];
    const c = close[i];
    const v = volume[i];
    if ([o, h, l, c, v].some((x) => x == null || Number.isNaN(x))) continue;
    candles.push({ time: ts[i], open: o, high: h, low: l, close: c, volume: v });
  }
  return candles;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    symbol: searchParams.get('symbol') ?? undefined,
    range: searchParams.get('range') ?? undefined,
    interval: searchParams.get('interval') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const { symbol, range, interval } = parsed.data;

  const encodedSymbol = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?range=${range}&interval=${interval}&includePrePost=false`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    },
    // Yahoo tolerates GET; Next cache disabled via dynamic
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Upstream fetch failed', status: res.status }, { status: 502 });
  }

  const json = await res.json();
  const candles = toCandles(json);
  return NextResponse.json({ candles });
}
