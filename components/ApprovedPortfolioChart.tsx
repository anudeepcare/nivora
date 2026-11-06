"use client";
import { historyBatch } from "@/lib/history-batch";
import { seriesDirection } from "@/lib/visual-signals";
import styles from "./PortfolioChart.module.css";
import { customerText } from "@/lib/customer-language";

import { useEffect, useId, useMemo, useState, useRef } from "react";
import type { Candle, Position, Research } from "@/lib/types";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import {
  portfolioHistory,
  type WorkspaceHistory,
} from "@/lib/approved-workspace";
import { api } from "@/lib/client";
import { readResource } from "@/lib/resource-cache";
import { amount, dateLabel } from "@/lib/format";
import { useProduct } from "./Session";

export default function ApprovedPortfolioChart({
  positions,
  quotes,
}: {
  positions: Position[];
  quotes: QuoteRows;
}) {
  const { cache, demo, owner } = useProduct();
  const [history, setHistory] = useState<WorkspaceHistory>({}),
    [loading, setLoading] = useState(false),
    [revision, setRevision] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const attempted = useRef<{scope:string;symbols:Set<string>}>({scope:"",symbols:new Set()});
  const [width, setWidth] = useState(640);
  const [inspection, setInspection] = useState<number | null>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const gradient = useId().replaceAll(":", "");
  const symbols = [
    ...new Set(
      positions
        .filter(
          (p) =>
            p.assetType !== "cash" &&
            quotes[p.symbol]?.quote?.currency === "USD",
        )
        .map((p) => p.symbol),
    ),
  ].sort();
  const key = symbols.join(",");
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    const saved: WorkspaceHistory = {};
    const selected = key ? key.split(",") : [];
    for (const symbol of selected) {
      const research =
        demo?.research[symbol] ??
        (cache.get(`research/${encodeURIComponent(symbol.replace("/", "-"))}`)
          ?.value as Research | undefined);
      const chart = cache.get(
        `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=6M`,
      )?.value as { candles: Candle[]; source: string } | undefined;
      if (chart?.candles?.length) saved[symbol] = chart;
      else if (research?.history?.length)
        saved[symbol] = {
          candles: research.history,
          source: research.historySource || "Supplied research history",
        };
    }
    setHistory(saved);
    const scope = `${owner}:${key}`;
    if(attempted.current.scope !== scope) attempted.current={scope,symbols:new Set()};
    const missing = historyBatch(selected,new Set(Object.keys(saved)),attempted.current.symbols);
    if (demo || !missing.length) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    void (async () => {
      // Bounded, sequential reads avoid consuming a whole account's market-data budget.
      for (const symbol of missing) {
        if (!active) break;
        attempted.current.symbols.add(symbol);
        const path = `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=6M`;
        try {
          const result = await readResource(cache, path, 900000, () =>
            api<{ candles: Candle[]; source: string }>(
              path,
              undefined,
              abort.signal,
            ),
          );
          if (active) setHistory((prior) => ({ ...prior, [symbol]: result }));
        } catch {
          /* Keep the valid partial series; coverage below names exclusions. */
        }
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [key, cache, demo, owner, revision]);
  const chart = useMemo(
    () =>
      portfolioHistory(
        positions,
        quotes,
        history,
        demo
          ? Object.values(demo.research)[0]?.retrievedAt.slice(0, 10)
          : undefined,
      ),
    [positions, quotes, history, demo],
  );
  useEffect(() => setInspection(null), [chart]);
  const selectedPoint = inspection == null ? null : chart.points[Math.min(inspection, chart.points.length - 1)];
  const values = chart.points.map((p) => p.value),
    low = Math.min(...values),
    high = Math.max(...values),
    spread = Math.max(high - low, high * 0.03, 1),
    bottom = low - spread * 0.12,
    top = high + spread * 0.12;
  const right = width - 12;
  const x = (i: number) =>
    58 + (i / Math.max(1, values.length - 1)) * (right - 58);
  const y = (v: number) => 260 - ((v - bottom) / (top - bottom)) * 225;
  const path = values
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");
  return (
    <div ref={container} className={styles.chart}>
      {chart.points.length > 1 && <div className={styles.inspection} aria-live="polite" aria-atomic="true">
        {selectedPoint ? <><span>{dateLabel(selectedPoint.time)} · Value of included holdings</span><strong>{amount(selectedPoint.value, "USD")}</strong></> : <span>Hover or touch the chart to inspect a date. Use arrow keys when focused.</span>}
      </div>}
      {chart.points.length > 1 ? (
        <svg
          viewBox={`0 0 ${width} 320`}
          className="data-chart approved-portfolio-chart"
          data-direction={seriesDirection(values)}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={chart.points.length - 1}
          aria-valuenow={inspection ?? chart.points.length - 1}
          aria-valuetext={`${dateLabel((selectedPoint ?? chart.points.at(-1)!).time)}: ${amount((selectedPoint ?? chart.points.at(-1)!).value, "USD")}, value of included holdings`}
          onPointerMove={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width * width;
            setInspection(Math.max(0, Math.min(values.length-1, Math.round((px-58)/(right-58)*(values.length-1)))));
          }}
          onPointerDown={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            setInspection(Math.max(0, Math.min(values.length-1, Math.round(((event.clientX-rect.left)/rect.width*width-58)/(right-58)*(values.length-1)))));
          }}
          onPointerLeave={event => { if(event.pointerType === "mouse") setInspection(null); }}
          onFocus={() => setInspection(i => i ?? chart.points.length-1)}
          onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return;
            event.preventDefault();
            setInspection(i => event.key === "Escape" ? null : event.key === "Home" ? 0 : event.key === "End" ? values.length-1 : Math.max(0,Math.min(values.length-1,(i ?? values.length-1)+(event.key === "ArrowLeft" ? -1 : 1))));
          }}
          aria-label={`Current quantities of ${chart.included.join(", ")} at supplied historical USD prices, ${chart.points[0].time} to ${chart.points.at(-1)!.time}. Not account performance.`}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity=".18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => {
            const value = bottom + ((top - bottom) * i) / 3;
            return (
              <g key={i}>
                <line
                  x1="58"
                  x2={right}
                  y1={y(value)}
                  y2={y(value)}
                  className="chart-grid"
                />
                <text
                  x="50"
                  y={y(value) + 4}
                  textAnchor="end"
                  className="chart-axis"
                >
                  {amount(value, "USD", true)}
                </text>
              </g>
            );
          })}
          <path
            d={`${path} L${right} 270 L58 270 Z`}
            fill={`url(#${gradient})`}
          />
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx={right} cy={y(values.at(-1)!)} r="4" fill="currentColor" />
          {selectedPoint && inspection != null && <g pointerEvents="none">
            <line x1={x(inspection)} x2={x(inspection)} y1="30" y2="270" stroke="currentColor" strokeDasharray="4 4" opacity=".5" />
            <circle cx={x(inspection)} cy={y(selectedPoint.value)} r="5" fill="currentColor" stroke="var(--card)" strokeWidth="2" />
          </g>}
          <text x="58" y="301" className="chart-axis">
            {dateLabel(chart.points[0].time)}
          </text>
          <text x={right} y="301" textAnchor="end" className="chart-axis">
            {dateLabel(chart.points.at(-1)!.time)}
          </text>
        </svg>
      ) : (
        <div className="approved-chart-empty">
          <strong>
            {loading
              ? "Loading your holdings’ price history…"
              : positions.some((p) => p.assetType !== "cash")
                ? "Price history is not available yet."
                : "Your portfolio takes shape here."}
          </strong>
          <p>
            {positions.some((p) => p.assetType !== "cash")
              ? "A chart needs at least two shared dates of supplied USD prices."
              : "Add your holdings to see their value, allocation and historical price context."}
          </p>
        </div>
      )}
      {chart.points.length > 1 && (
        <details className={styles.values}>
          <summary>Data & calculation</summary>
          <p>Current quantities at historical prices · USD. Cash, managed balances, margin, dividends and trades are excluded.</p>
          <div>
            <table>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Modeled value</th>
                </tr>
              </thead>
              <tbody>
                {[...chart.points].reverse().map((point) => (
                  <tr key={point.time}>
                    <td>{dateLabel(point.time)}</td>
                    <td>{amount(point.value, "USD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <p className="chart-note">
        {chart.included.length
          ? `${chart.included.length} of ${symbols.length} USD instruments · ${[...new Set(chart.sources.map(customerText))].join("; ")}. `
          : ""}
        Current holdings at past prices—not account performance.
      </p>
      {!!chart.excluded.length && (
        <p className="chart-note">
          History excluded: {chart.excluded.join(", ")}. Dates are shared
          observations; missing prices are not filled.
        </p>
      )}
      {!!symbols.length && !!chart.excluded.length && !demo && (
        <button
          className="text-link approved-chart-retry"
          disabled={loading}
          onClick={() => setRevision((r) => r + 1)}
        >
          {loading ? "Loading available history…" : `Load missing histories (${chart.excluded.length})`}
        </button>
      )}
    </div>
  );
}
