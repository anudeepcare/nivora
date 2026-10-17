"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import type { Candle } from "@/lib/types";
import { useProduct } from "./Session";
const EMPTY_LEVELS: { label: string; price: number }[] = [];
export function PriceChart({
  bars,
  range,
  style = "line",
  levels = EMPTY_LEVELS,
}: {
  bars: Candle[];
  range: string;
  style?: "line" | "candles";
  levels?: { label: string; price: number }[];
}) {
  const element = useRef<HTMLDivElement>(null),
    chart = useRef<IChartApi | null>(null),
    series = useRef<ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | null>(
      null,
    ),
    lastRange = useRef(""),
    { theme } = useProduct();
  useEffect(() => {
    if (!element.current) return;
    const api = createChart(element.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? "#a1aec2" : "#5a677b",
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: theme === "dark" ? "#263142" : "#e7ecf4" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: range === "1D" || range === "1W",
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: false,
        pinch: false,
        axisPressedMouseMove: false,
      },
    });
    chart.current = api;
    series.current =
      style === "candles"
        ? api.addSeries(CandlestickSeries, {
            upColor: "#28b894",
            downColor: "#e26c7a",
            borderVisible: false,
            wickUpColor: "#28b894",
            wickDownColor: "#e26c7a",
          })
        : api.addSeries(AreaSeries, {
            lineColor: "#5e8aff",
            topColor: "#3f75ee35",
            bottomColor: "#3f75ee00",
            lineWidth: 2,
            priceLineVisible: false,
          });
    lastRange.current = "";
    return () => {
      api.remove();
      chart.current = null;
      series.current = null;
    };
  }, [theme, style]);
  useEffect(() => {
    if (!series.current || !chart.current) return;
    const unique = new Map<string, any>();
    for (const b of bars) {
      const time: Time =
        b.time.length === 10
          ? b.time
          : (Math.floor(Date.parse(b.time) / 1000) as Time);
      if (typeof time === "number" && !Number.isFinite(time)) continue;
      unique.set(
        String(time),
        style === "candles"
          ? { time, open: b.open, high: b.high, low: b.low, close: b.close }
          : { time, value: b.close },
      );
    }
    series.current.setData([...unique.values()]);
    chart.current.applyOptions({
      timeScale: { timeVisible: range === "1D" || range === "1W" },
    });
    if (lastRange.current !== range && bars.length) {
      chart.current.timeScale().fitContent();
      lastRange.current = range;
    }
    const lines = levels
      .filter((l) => Number.isFinite(l.price) && l.price > 0)
      .map((l) =>
        series.current!.createPriceLine({
          price: l.price,
          title: l.label,
          color: "#a38cdd",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
        }),
      );
    return () => {
      for (const l of lines)
        try {
          series.current?.removePriceLine(l);
        } catch {}
    };
  }, [bars, range, theme, style, levels]);
  function zoom(factor: number) {
    const scale = chart.current?.timeScale(),
      r = scale?.getVisibleLogicalRange();
    if (!scale || !r) return;
    const middle = (r.from + r.to) / 2,
      half = ((r.to - r.from) * factor) / 2;
    scale.setVisibleLogicalRange({ from: middle - half, to: middle + half });
  }
  return (
    <div>
      <div className="chart-tools" aria-label="Chart zoom controls">
        <button
          type="button"
          onClick={() => zoom(0.7)}
          aria-label="Zoom into chart"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoom(1.4)}
          aria-label="Zoom out of chart"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => chart.current?.timeScale().fitContent()}
        >
          Reset
        </button>
      </div>
      <div
        className="price-chart"
        role="img"
        aria-label={`Price history for ${range}; ${bars.length} observations. Scroll continues through the page.`}
        ref={element}
      />
    </div>
  );
}
export function MiniChart({
  values,
  color = "blue",
  bars = false,
  labels = [],
}: {
  values: (number | null)[];
  color?: string;
  bars?: boolean;
  labels?: string[];
}) {
  const valid = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  if (valid.length < 2)
    return <div className="mini-empty">More reported periods needed</div>;
  const min = bars ? Math.min(0, ...valid) : Math.min(...valid),
    max = Math.max(...valid),
    span = max - min || 1,
    y = (v: number) => 68 - ((v - min) / span) * 57,
    zero = y(0),
    step = 260 / Math.max(1, values.length - 1);
  return (
    <div className={`mini-chart ${color}`}>
      <svg
        viewBox="0 0 280 96"
        role="img"
        aria-label="Reported financial trend; exact values in the statements view"
      >
        {bars
          ? values.map((v, i) =>
              v == null ? null : (
                <rect
                  key={i}
                  x={8 + (i * 268) / values.length}
                  y={Math.min(zero, y(v))}
                  width={Math.min(32, 190 / values.length)}
                  height={Math.max(1, Math.abs(y(v) - zero))}
                  rx="2"
                  fill="currentColor"
                >
                  <title>{v.toLocaleString()}</title>
                </rect>
              ),
            )
          : values
              .reduce<string[][]>(
                (segments, v, i) => {
                  if (v == null) segments.push([]);
                  else segments.at(-1)!.push(`${10 + i * step},${y(v)}`);
                  return segments;
                },
                [[]],
              )
              .map((points, i) => (
                <polyline
                  key={i}
                  points={points.join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
        {labels.map((label, i) => (
          <text
            key={i}
            x={bars ? 20 + (i * 268) / values.length : 10 + i * step}
            y="91"
            textAnchor="middle"
            className="chart-label"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
