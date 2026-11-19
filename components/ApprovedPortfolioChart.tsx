"use client";
import { accountHistoryWindow } from "@/lib/account-history-window";
import {
  holdingsBenchmarkOverlay,
  priceChangeGap,
} from "@/lib/holdings-benchmark-overlay";
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
import { api, ApiError } from "@/lib/client";
import { readResource } from "@/lib/resource-cache";
import { amount, dateLabel, percent } from "@/lib/format";
import { useProduct } from "./Session";
import { portfolioPercentScale } from "@/lib/portfolio-plot";
import { portfolioRange } from "@/lib/portfolio-range";
import PortfolioRange from "./PortfolioRange";

function priceMove(points: { value: number }[]) {
  const first = points[0]?.value;
  const last = points.at(-1)?.value;
  return first > 0 && Number.isFinite(last)
    ? percent(((last! - first) / first) * 100, true)
    : "—";
}

export default function ApprovedPortfolioChart({
  positions,
  quotes,
  compact = false,
  showBenchmarks = compact,
}: {
  positions: Position[];
  quotes: QuoteRows;
  compact?: boolean;
  showBenchmarks?: boolean;
}) {
  const { cache, demo, owner } = useProduct();
  const [history, setHistory] = useState<WorkspaceHistory>({}),
    [loading, setLoading] = useState(false),
    [revision, setRevision] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const attempted = useRef<{ scope: string; symbols: Set<string> }>({
    scope: "",
    symbols: new Set(),
  });
  const [width, setWidth] = useState(640);
  const [inspection, setInspection] = useState<number | null>(null);
  const [period, setPeriod] = useState("6M");
  const [historyRange, setHistoryRange] = useState("6M");
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
  const key = [
    ...new Set([
      ...symbols,
      ...(showBenchmarks && symbols.length ? ["SPY", "QQQ"] : []),
    ]),
  ]
    .sort()
    .join(",");
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
        `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=${historyRange}`,
      )?.value as { candles: Candle[]; source: string } | undefined;
      if (chart?.candles?.length) saved[symbol] = chart;
      else if (historyRange === "6M" && research?.history?.length)
        saved[symbol] = {
          candles: research.history,
          source: research.historySource || "Supplied research history",
        };
    }
    setHistory(saved);
    const scope = `${owner}:${key}:${historyRange}`;
    if (attempted.current.scope !== scope)
      attempted.current = { scope, symbols: new Set() };
    const missing = historyBatch(
      selected,
      new Set(Object.keys(saved)),
      attempted.current.symbols,
      selected.length,
    );
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
        const path = `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=${historyRange}`;
        try {
          const result = await readResource(cache, path, 900000, () =>
            api<{ candles: Candle[]; source: string }>(
              path,
              undefined,
              abort.signal,
            ),
          );
          if (active) setHistory((prior) => ({ ...prior, [symbol]: result }));
        } catch (error) {
          if (
            error instanceof ApiError &&
            [401, 403, 429].includes(error.status)
          )
            break;
          /* Keep the valid partial series; coverage below names exclusions. */
        }
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [key, cache, demo, owner, revision, historyRange]);
  const fullHistory = useMemo(
    () =>
      portfolioHistory(
        positions,
        quotes,
        history,
        demo
          ? Object.values(demo.research)[0]?.retrievedAt.slice(0, 10)
          : undefined,
        compact ? 760 : 60,
      ),
    [positions, quotes, history, demo, compact],
  );
  const chart = useMemo(() => {
    if (!compact) return { ...fullHistory, availableFrom: null };
    const { cutoff, actualStart, requestedStart } = accountHistoryWindow(
      fullHistory.points.map((p) => p.time),
      period,
    );
    return {
      ...fullHistory,
      availableFrom:
        actualStart &&
        requestedStart &&
        Date.parse(actualStart) - Date.parse(requestedStart) > 5 * 86400000
          ? actualStart
          : null,
      points: fullHistory.points.filter((p) => Date.parse(p.time) >= cutoff),
    };
  }, [fullHistory, compact, period]);
  const range = useMemo(
    () =>
      compact
        ? null
        : portfolioRange(
            positions,
            quotes,
            history,
            demo
              ? Object.values(demo.research)[0]?.retrievedAt.slice(0, 10)
              : undefined,
          ),
    [positions, quotes, history, demo, compact],
  );
  useEffect(() => setInspection(null), [chart]);
  const selectedPoint =
    inspection == null
      ? null
      : chart.points[Math.min(inspection, chart.points.length - 1)];
  const overlays = showBenchmarks
    ? (["SPY", "QQQ"] as const)
        .map((symbol) => ({
          symbol,
          points: holdingsBenchmarkOverlay(
            chart.points,
            history[symbol]?.candles ?? [],
          ),
        }))
        .filter((b) => b.points.length > 1)
    : [];
  const spy = overlays.find((b) => b.symbol === "SPY");
  const gap = spy && !loading ? priceChangeGap(chart.points, spy.points) : null;
  const plotted = (value: number) =>
    compact && chart.points[0]?.value > 0
      ? (value / chart.points[0].value - 1) * 100
      : value;
  const values = chart.points.map((p) => plotted(p.value)),
    domain = [
      ...values,
      ...overlays.flatMap((b) => b.points.map((p) => plotted(p.value))),
      ...(compact ? [0] : []),
    ],
    low = Math.min(...domain),
    high = Math.max(...domain),
    spread = Math.max(high - low, high * 0.03, 1),
    scale = compact ? portfolioPercentScale(low, high) : null,
    bottom = scale?.min ?? low - spread * 0.12,
    top = scale?.max ?? high + spread * 0.12;
  const ticks = scale
    ? scale.ticks.filter((n) => n !== 0)
    : [0, 1, 2, 3].map((i) => bottom + ((top - bottom) * i) / 3);
  const right = width - 12;
  const x = (i: number) =>
    58 + (i / Math.max(1, values.length - 1)) * (right - 58);
  const y = (v: number) => 260 - ((v - bottom) / (top - bottom)) * 225;
  const path = values
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");
  return (
    <div
      ref={container}
      className={styles.chart}
      data-compact={compact || undefined}
    >
      {compact && (
        <div className={styles.chartToolbar}>
          <div>
            <strong>Price comparison</strong>
            <span>
              {chart.points.length > 1
                ? `${dateLabel(chart.points[0].time)} – ${dateLabel(chart.points.at(-1)!.time)}`
                : "Dated holdings history"}
            </span>
          </div>
          <div
            className={styles.periods}
            role="group"
            aria-label="Holdings history period"
          >
            {["1M", "3M", "6M", "1Y", "2Y"].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => {
                  setInspection(null);
                  setPeriod(value);
                  if (value === "2Y") setHistoryRange("5Y");
                  else if (value === "1Y")
                    setHistoryRange((range) => (range === "5Y" ? range : "1Y"));
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
      {!compact && (
        <p className="chart-note" role="status">
          <strong>
            {loading
              ? "Loading holdings history…"
              : chart.excluded.length
                ? "Partial holdings history"
                : "Holdings price history"}
          </strong>{" "}
          · {chart.included.length} of {symbols.length} holdings
          {!compact && ". Cash, managed balances and margin are excluded."}
          {!loading && chart.availableFrom && (
            <> · Available history starts {dateLabel(chart.availableFrom)}</>
          )}
        </p>
      )}
      {compact && chart.points.length > 1 && (
        <div
          className={styles.seriesReadout}
          aria-live="polite"
          aria-atomic="true"
        >
          {[{ symbol: "HOLDINGS", points: chart.points }, ...overlays].map(
            (b) => {
              const point =
                b.points[
                  Math.min(
                    inspection ?? b.points.length - 1,
                    b.points.length - 1,
                  )
                ];
              const change = plotted(point.value);
              return (
                <div key={b.symbol} data-benchmark={b.symbol}>
                  <span>
                    {b.symbol === "HOLDINGS"
                      ? "Your holdings"
                      : b.symbol === "SPY"
                        ? "S&P 500 · SPY"
                        : "Nasdaq-100 · QQQ"}
                  </span>
                  <strong>
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </strong>
                  <small>
                    {amount(point.value, "USD")}
                    {b.symbol !== "HOLDINGS" ? " rebased" : " basket"}
                  </small>
                </div>
              );
            },
          )}
          <p>
            {dateLabel((selectedPoint ?? chart.points.at(-1)!).time)} ·{" "}
            {selectedPoint ? "Selected observation" : "Latest observation"}
          </p>
        </div>
      )}
      {!compact && showBenchmarks && chart.points.length > 1 && (
        <div className={styles.benchmarkLegend}>
          <header>
            <strong>
              {compact ? "Price change from shared start" : "Price changes"}
            </strong>
            <span>
              {dateLabel(chart.points[0].time)} –{" "}
              {dateLabel(chart.points.at(-1)!.time)}
            </span>
          </header>
          <span data-benchmark="HOLDINGS">
            Holdings <strong>{priceMove(chart.points)}</strong>
          </span>
          {overlays.map((b) => (
            <span key={b.symbol} data-benchmark={b.symbol}>
              {b.symbol === "SPY" ? "S&P 500 (SPY)" : "Nasdaq-100 (QQQ)"}{" "}
              <strong>{priceMove(b.points)}</strong>
            </span>
          ))}
          {compact && gap !== null && (
            <small className={styles.gap}>
              {Math.abs(gap) < 0.05
                ? "In line with the S&P 500 over this window"
                : `${Math.abs(gap).toFixed(1)} percentage points ${gap < 0 ? "behind" : "ahead of"} the S&P 500`}
            </small>
          )}
          {!loading && overlays.length < 2 && (
            <small>
              {["SPY", "QQQ"]
                .filter((symbol) => !overlays.some((b) => b.symbol === symbol))
                .join(" / ")}
              : matching dated closes unavailable.
            </small>
          )}
        </div>
      )}
      {!compact && chart.points.length > 1 && (
        <>
          <dl className={styles.totals}>
            <div>
              <dt>Historical value · {dateLabel(chart.points.at(-1)!.time)}</dt>
              <dd>{amount(chart.points.at(-1)!.value, "USD")}</dd>
            </div>
            <div>
              <dt>Same holdings · latest quotes</dt>
              <dd>
                {amount(
                  positions.reduce(
                    (total, p) =>
                      total +
                      (p.assetType !== "cash" &&
                      chart.included.includes(p.symbol)
                        ? Number(p.quantity || 0) *
                          (quotes[p.symbol]?.quote?.price || 0)
                        : 0),
                    0,
                  ),
                  "USD",
                )}
              </dd>
            </div>
          </dl>
          {!compact && (
            <p className="chart-note">
              Values cover the included holdings, not your full account balance.
            </p>
          )}
        </>
      )}
      {!compact && chart.points.length > 1 && (
        <div
          className={styles.inspection}
          aria-live="polite"
          aria-atomic="true"
        >
          {(selectedPoint ?? chart.points.at(-1)) ? (
            <>
              <span>
                {dateLabel((selectedPoint ?? chart.points.at(-1)!).time)} ·
                Value of included holdings
              </span>
              <strong>
                {amount((selectedPoint ?? chart.points.at(-1)!).value, "USD")}
              </strong>
              {overlays.map((b) => (
                <span key={b.symbol}>
                  {b.symbol} rebased:{" "}
                  {amount(
                    b.points[
                      Math.min(
                        inspection ?? b.points.length - 1,
                        b.points.length - 1,
                      )
                    ].value,
                    "USD",
                  )}
                </span>
              ))}
            </>
          ) : (
            <span>
              Hover or touch the chart to inspect a date. Use arrow keys when
              focused.
            </span>
          )}
        </div>
      )}
      {chart.points.length > 1 ? (
        <svg
          viewBox={`0 0 ${width} 320`}
          className="data-chart approved-portfolio-chart"
          data-direction={compact ? undefined : seriesDirection(values)}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={chart.points.length - 1}
          aria-valuenow={inspection ?? chart.points.length - 1}
          aria-valuetext={`${dateLabel((selectedPoint ?? chart.points.at(-1)!).time)}: ${amount((selectedPoint ?? chart.points.at(-1)!).value, "USD")}, value of included holdings`}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const px = ((event.clientX - rect.left) / rect.width) * width;
            setInspection(
              Math.max(
                0,
                Math.min(
                  values.length - 1,
                  Math.round(((px - 58) / (right - 58)) * (values.length - 1)),
                ),
              ),
            );
          }}
          onPointerDown={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setInspection(
              Math.max(
                0,
                Math.min(
                  values.length - 1,
                  Math.round(
                    ((((event.clientX - rect.left) / rect.width) * width - 58) /
                      (right - 58)) *
                      (values.length - 1),
                  ),
                ),
              ),
            );
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setInspection(null);
          }}
          onFocus={() => setInspection((i) => i ?? chart.points.length - 1)}
          onKeyDown={(event) => {
            if (
              !["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(
                event.key,
              )
            )
              return;
            event.preventDefault();
            setInspection((i) =>
              event.key === "Escape"
                ? null
                : event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? values.length - 1
                    : Math.max(
                        0,
                        Math.min(
                          values.length - 1,
                          (i ?? values.length - 1) +
                            (event.key === "ArrowLeft" ? -1 : 1),
                        ),
                      ),
            );
          }}
          aria-label={`Current quantities of ${chart.included.join(", ")} at supplied historical USD prices, ${chart.points[0].time} to ${chart.points.at(-1)!.time}. Not account performance.`}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--holdings-series)"
                stopOpacity=".12"
              />
              <stop
                offset="100%"
                stopColor="var(--holdings-series)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          {ticks.map((value) => {
            return (
              <g key={value}>
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
                  {compact
                    ? `${value > 0 ? "+" : ""}${Number(value.toFixed(1))}%`
                    : amount(value, "USD", true)}
                </text>
              </g>
            );
          })}
          {(compact || overlays.length > 0) && (
            <g aria-hidden="true">
              {compact && (
                <text
                  x="50"
                  y={y(0) + 4}
                  textAnchor="end"
                  className="chart-axis"
                >
                  0%
                </text>
              )}
              <line
                x1="58"
                x2={right}
                y1={y(compact ? 0 : values[0])}
                y2={y(compact ? 0 : values[0])}
                stroke="var(--holdings-series)"
                strokeDasharray="3 5"
                opacity=".32"
              />
            </g>
          )}
          <path
            d={`${path} L${right} 270 L58 270 Z`}
            fill={`url(#${gradient})`}
          />
          <path
            d={path}
            fill="none"
            stroke="var(--holdings-series)"
            style={{ stroke: "var(--holdings-series)" }}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {overlays.map((b) => (
            <path
              key={b.symbol}
              data-benchmark={b.symbol}
              className={styles.benchmarkLine}
              style={{
                stroke:
                  b.symbol === "SPY"
                    ? "var(--spy-series)"
                    : "var(--qqq-series)",
              }}
              d={b.points
                .map(
                  (p, i) =>
                    `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(plotted(p.value)).toFixed(2)}`,
                )
                .join(" ")}
              fill="none"
              strokeWidth="2"
              strokeDasharray={b.symbol === "SPY" ? "8 4" : "2 4"}
            />
          ))}
          <circle
            cx={right}
            cy={y(values.at(-1)!)}
            r="4"
            fill="var(--holdings-series)"
          />
          {overlays.map((b) => (
            <circle
              key={b.symbol}
              data-benchmark={b.symbol}
              className={styles.benchmarkMarker}
              cx={right}
              cy={y(plotted(b.points.at(-1)!.value))}
              r="3"
            />
          ))}
          {selectedPoint && inspection != null && (
            <g pointerEvents="none">
              <line
                x1={x(inspection)}
                x2={x(inspection)}
                y1="30"
                y2="270"
                stroke="var(--holdings-series)"
                strokeDasharray="4 4"
                opacity=".5"
              />
              {overlays.map((b) => (
                <circle
                  key={b.symbol}
                  data-benchmark={b.symbol}
                  className={styles.benchmarkMarker}
                  cx={x(inspection)}
                  cy={y(
                    plotted(
                      b.points[Math.min(inspection, b.points.length - 1)].value,
                    ),
                  )}
                  r="4"
                  stroke="var(--card)"
                  strokeWidth="2"
                />
              ))}
              <circle
                cx={x(inspection)}
                cy={y(plotted(selectedPoint.value))}
                r="5"
                fill="var(--holdings-series)"
                stroke="var(--card)"
                strokeWidth="2"
              />
            </g>
          )}
          <text x="58" y="301" className="chart-axis">
            {dateLabel(chart.points[0].time)}
          </text>
          {compact &&
            width >= 640 &&
            chart.points.length > 12 &&
            [1, 2].map((part) => {
              const i = Math.round((part / 3) * (chart.points.length - 1));
              return (
                <text
                  key={part}
                  x={x(i)}
                  y="301"
                  textAnchor="middle"
                  className="chart-axis"
                >
                  {dateLabel(chart.points[i].time)}
                </text>
              );
            })}
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
      {compact && (
        <p className={styles.chartCaption} role="status">
          {loading ? "Loading history · " : ""}
          {chart.included.length} of {symbols.length} holdings · Benchmarks use
          the same starting dollars.
          {!loading && chart.availableFrom && (
            <> Available from {dateLabel(chart.availableFrom)}.</>
          )}
          {gap !== null && !loading && (
            <>
              {" "}
              S&P 500 gap: {gap > 0 ? "+" : ""}
              {gap.toFixed(1)} pp over the displayed window.
            </>
          )}
          {!loading && overlays.length < 2 && (
            <>
              {" "}
              {["SPY", "QQQ"]
                .filter((symbol) => !overlays.some((b) => b.symbol === symbol))
                .join(" / ")}
              : matching closes unavailable.
            </>
          )}{" "}
          Hover, tap or use arrow keys to inspect.
        </p>
      )}
      {range && !loading && <PortfolioRange range={range} />}
      {chart.points.length > 1 && (
        <details className={styles.values}>
          <summary>Data & calculation</summary>
          <p>
            Current quantities at historical prices · USD. Cash, managed
            balances, margin, dividends and trades are excluded.
          </p>
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
      {!compact && (
        <p className="chart-note">
          {chart.included.length
            ? `${chart.included.length} of ${symbols.length} USD instruments · ${[...new Set(chart.sources.map(customerText))].join("; ")}. `
            : ""}
          Current holdings at past prices—not account performance.
        </p>
      )}
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
          {loading
            ? "Loading available history…"
            : `Load missing histories (${chart.excluded.length})`}
        </button>
      )}
    </div>
  );
}
