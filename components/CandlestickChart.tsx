"use client";

import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import type { Candle, Signal } from '@/lib/types';

export default function CandlestickChart({ candles, signals }: { candles: Candle[]; signals: Signal[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0B1220' }, textColor: '#94A3B8' },
      grid: { vertLines: { color: '#1F2937' }, horzLines: { color: '#1F2937' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1F2937' },
      timeScale: { borderColor: '#1F2937' },
      localization: { priceFormatter: (p: number) => p.toFixed(2) },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981', downColor: '#EF4444', borderDownColor: '#EF4444', borderUpColor: '#10B981', wickDownColor: '#EF4444', wickUpColor: '#10B981',
    });
    seriesRef.current = candleSeries;

    const handleResize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      chart.applyOptions({ width: parent.clientWidth, height: parent.clientHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const data = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    seriesRef.current.setData(data);

    // add markers for signals
    const markers = signals.map((s) => ({
      time: s.time as UTCTimestamp,
      position: s.type === 'long' ? 'belowBar' : s.type === 'short' ? 'aboveBar' : 'inBar',
      color: s.type === 'long' ? '#10B981' : s.type === 'short' ? '#EF4444' : '#F59E0B',
      shape: s.type === 'long' ? 'arrowUp' : s.type === 'short' ? 'arrowDown' : 'circle',
      text: s.label,
    } as const));
    seriesRef.current.setMarkers(markers);
  }, [candles, signals]);

  return <div ref={containerRef} className="w-full h-full" />;
}
