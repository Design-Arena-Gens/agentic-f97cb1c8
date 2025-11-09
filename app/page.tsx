"use client";

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fetchIntraday } from '@/lib/fetchIntraday';
import { analyzePatterns } from '@/lib/patterns';
import type { Candle, Signal } from '@/lib/types';
import dynamic from 'next/dynamic';

const CandlestickChart = dynamic(() => import('@/components/CandlestickChart'), { ssr: false });

const DEFAULT_SYMBOL = '^NSEI';

export default function HomePage() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_SYMBOL);
  const [range, setRange] = useState<'1d' | '5d' | '1mo'>('5d');
  const [interval, setInterval] = useState<'1m' | '5m' | '15m' | '30m' | '60m'>('5m');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIntraday({ symbol, range, interval });
      setCandles(data);
      const found = analyzePatterns(data);
      setSignals(found);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestSignal = useMemo(() => {
    if (signals.length === 0) return null;
    return signals[signals.length - 1];
  }, [signals]);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">AI Nifty Intraday Agent</h1>
          <p className="text-slate-400">Detects high-probability intraday breakout and momentum patterns on NIFTY 50.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="block text-sm text-slate-400">Symbol (Yahoo)</label>
            <input
              className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-44"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="^NSEI"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Range</label>
            <select
              className="bg-slate-900 border border-slate-800 rounded px-3 py-2"
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
            >
              <option value="1d">1 day</option>
              <option value="5d">5 days</option>
              <option value="1mo">1 month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400">Interval</label>
            <select
              className="bg-slate-900 border border-slate-800 rounded px-3 py-2"
              value={interval}
              onChange={(e) => setInterval(e.target.value as any)}
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="30m">30m</option>
              <option value="60m">60m</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading?' : 'Analyze'}
          </button>
        </form>
      </header>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-200 rounded p-3">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{symbol} Chart</h2>
              <p className="text-xs text-slate-400">{candles.length > 0 ? `${format(candles[0].time * 1000, 'PP')} ? ${format(candles[candles.length - 1].time * 1000, 'PPp')}` : '?'}</p>
            </div>
            {latestSignal && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Latest signal</p>
                <p className={`text-sm font-medium ${latestSignal.type === 'long' ? 'text-emerald-400' : latestSignal.type === 'short' ? 'text-rose-400' : 'text-amber-300'}`}>{latestSignal.label}</p>
              </div>
            )}
          </div>
          <div className="h-[560px]">
            <CandlestickChart candles={candles} signals={signals} />
          </div>
        </div>
        <aside className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded p-3">
            <h3 className="font-semibold mb-2">Detected Signals</h3>
            <div className="space-y-2 max-h-[540px] overflow-auto pr-1">
              {signals.length === 0 && <p className="text-slate-400 text-sm">No signals yet.</p>}
              {signals.map((s, idx) => (
                <div key={idx} className="border border-slate-800 rounded p-2 bg-slate-950">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${s.type === 'long' ? 'text-emerald-400' : s.type === 'short' ? 'text-rose-400' : 'text-amber-300'}`}>{s.label}</span>
                    <span className="text-[10px] text-slate-400">{format(s.time * 1000, 'PP p')}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{s.reason}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded p-3">
            <h3 className="font-semibold mb-2">Tips</h3>
            <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
              <li>Use ORB with VWAP alignment for higher conviction.</li>
              <li>Prefer trades during volatility expansion with rising volume.</li>
              <li>Avoid counter-trend trades against VWAP slope.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
