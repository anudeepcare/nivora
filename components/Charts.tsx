"use client";
import charts from "./Charts.module.css";
import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type ISeriesPrimitive,
} from "lightweight-charts";
import type { PaceChartBand } from "@/lib/pace-chart-bands";
import type { Candle } from "@/lib/types";
import { useProduct } from "./Session";
const EMPTY_COLORS: Record<string, string> = {};
const EMPTY_BANDS: PaceChartBand[] = [];
const EMPTY_LEVELS: { label: string; price: number }[] = [];
export function PriceChart({
  bars,
  range,
  style = "line",
  levels = EMPTY_LEVELS,
  contrast = false,
  candleColors = EMPTY_COLORS,
  paceBands = EMPTY_BANDS,
}: {
  bars: Candle[];
  range: string;
  style?: "line" | "candles";
  levels?: { label: string; price: number; color?: string }[];
  contrast?: boolean;
  candleColors?: Record<string, string>;
  paceBands?: PaceChartBand[];
}) {
  const [hover, setHover] = useState<{ time: string; values: string } | null>(
    null,
  );
  const element = useRef<HTMLDivElement>(null),
    chart = useRef<IChartApi | null>(null),
    series = useRef<ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | null>(
      null,
    ),
    lastRange = useRef(""),
    { theme } = useProduct();
  useEffect(() => {
    if (!element.current) return;
    const palette = getComputedStyle(element.current);
    const ink =
      palette.getPropertyValue("--muted").trim() ||
      (theme === "dark" ? "#a8b9c5" : "#5e6e79");
    const accent = palette.getPropertyValue("--ink").trim() || "#24272b";
    const grid =
      palette.getPropertyValue("--line").trim() ||
      (theme === "dark" ? "#2a3b47" : "#e2e7ec");
    const rgba = (hex: string, alpha: number) =>
      /^#[0-9a-f]{6}$/i.test(hex)
        ? `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${alpha})`
        : "rgba(34,103,216,0.1)";
    const api = createChart(element.current, {
      autoSize: true,
      localization: { locale: "en-US" },
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: ink,
        fontSize: 12,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: grid },
      },
      rightPriceScale: {
        borderVisible: false,
        visible: !contrast,
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      leftPriceScale: {
        borderVisible: false,
        visible: contrast,
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        ticksVisible: true,
        tickMarkMaxCharacterLength: 10,
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
            priceScaleId: contrast ? "left" : "right",
            upColor: "#28b894",
            downColor: "#e26c7a",
            borderVisible: false,
            wickUpColor: "#28b894",
            wickDownColor: "#e26c7a",
          })
        : api.addSeries(AreaSeries, {
            priceScaleId: contrast ? "left" : "right",
            lastValueVisible: !contrast,
            lineColor: accent,
            topColor: contrast ? "transparent" : rgba(accent, 0.2),
            bottomColor: rgba(accent, 0),
            lineWidth: 2,
            priceLineVisible: false,
          });
    const readCrosshair = (
      event: import("lightweight-charts").MouseEventParams<Time>,
    ) => {
      const current = series.current;
      const point = current ? event.seriesData.get(current) : undefined;
      if (!event.time || !point || !event.point) {
        setHover(null);
        return;
      }
      const time =
        typeof event.time === "number"
          ? new Date(event.time * 1000).toLocaleString("en-US", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }) + " UTC"
          : typeof event.time === "string"
            ? event.time
            : `${event.time.year}-${event.time.month}-${event.time.day}`;
      const number = (value: number) =>
        value.toLocaleString("en-US", { maximumFractionDigits: 4 });
      const datum = point as Partial<{
        open: number;
        high: number;
        low: number;
        close: number;
        value: number;
      }>;
      const values =
        typeof datum.close === "number" &&
        typeof datum.open === "number" &&
        typeof datum.high === "number" &&
        typeof datum.low === "number"
          ? `O ${number(datum.open)}  H ${number(datum.high)}  L ${number(datum.low)}  C ${number(datum.close)}`
          : typeof datum.value === "number"
            ? `Close ${number(datum.value)}`
            : "";
      setHover({ time, values });
    };
    api.subscribeCrosshairMove(readCrosshair);
    lastRange.current = "";
    // A retained dialog starts at width zero. Fit again when it gains layout width.
    let previousWidth = 0;
    let fitFrame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width > 0 && width !== previousWidth) {
        cancelAnimationFrame(fitFrame);
        fitFrame = requestAnimationFrame(() => api.timeScale().fitContent());
      }
      previousWidth = width;
    });
    observer.observe(element.current);
    return () => {
      api.unsubscribeCrosshairMove(readCrosshair);
      observer.disconnect();
      cancelAnimationFrame(fitFrame);
      api.remove();
      chart.current = null;
      series.current = null;
    };
  }, [theme, style, contrast]);
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
          ? {
              time,
              open: b.open,
              high: b.high,
              low: b.low,
              close: b.close,
              ...(candleColors[b.time]
                ? {
                    color: candleColors[b.time],
                    wickColor: candleColors[b.time],
                    borderColor: candleColors[b.time],
                  }
                : {}),
            }
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
      .map((l, index) =>
        series.current!.createPriceLine({
          price: l.price,
          title: l.label,
          color:
            l.color ?? ["#68ae94", "#916bb8", "#809a39", "#b46f5a"][index % 4],
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
  }, [bars, range, theme, style, levels, contrast, candleColors]);
  useEffect(() => {
    const current = series.current;
    if (!current || !paceBands.length) return;
    const colors = [
      "rgba(147,176,215,0.10)",
      "rgba(92,164,243,0.14)",
      "rgba(49,154,255,0.28)",
      "rgba(20,132,250,0.45)",
      "rgba(0,104,235,0.68)",
    ];
    const primitive: ISeriesPrimitive<Time> = {
      paneViews: () => [
        {
          zOrder: () => "bottom",
          renderer: () => ({
            draw: (target) =>
              target.useMediaCoordinateSpace(({ context, mediaSize }) => {
                for (const band of paceBands) {
                  const top = current.priceToCoordinate(band.high);
                  const bottom = current.priceToCoordinate(band.low);
                  if (top == null || bottom == null) continue;
                  const y = Math.max(0, top);
                  const end = Math.min(mediaSize.height, bottom);
                  if (end <= y) continue;
                  context.fillStyle = colors[band.level];
                  context.fillRect(0, y, mediaSize.width, end - y);
                  // Label only bands tall enough to read, without changing their scale.
                  if (end - y >= 22) {
                    context.font = "600 11px system-ui, sans-serif";
                    context.fillStyle =
                      band.level === 4
                        ? "#ffffff"
                        : theme === "dark"
                          ? "#edf3ff"
                          : contrast
                            ? "#000000"
                            : "#10223e";
                    context.fillText(
                      `P${band.level} · ${["Pause", "Watch / hold", "Start small", "Build gradually", "Deep accumulation"][band.level]}`,
                      8,
                      y + 15,
                    );
                  }
                }
              }),
          }),
        },
      ],
    };
    current.attachPrimitive(primitive);
    return () => {
      try {
        current.detachPrimitive(primitive);
      } catch {}
    };
  }, [paceBands, theme, style, contrast]);
  return (
    <div className={`chart-wrap ${charts.chart}`}>
      <div
        className={`chart-readout ${charts.readout}`}
        aria-label="Chart inspection"
      >
        <span>{hover?.time ?? "Explore the chart"}</span>
        <span style={{ fontWeight: 400, fontSize: 12 }}>
          {hover?.values ?? "Touch or hover to inspect"}
        </span>
      </div>
      <div
        className={`price-chart ${charts.plot}`}
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
    return (
      <div className={`mini-empty ${charts.empty}`}>
        More reported periods needed
      </div>
    );
  const min = bars ? Math.min(0, ...valid) : Math.min(...valid),
    max = Math.max(...valid),
    span = max - min || 1,
    y = (v: number) => 68 - ((v - min) / span) * 57,
    zero = y(0),
    step = 260 / Math.max(1, values.length - 1);
  return (
    <div className={`mini-chart ${charts.mini} ${color}`}>
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
