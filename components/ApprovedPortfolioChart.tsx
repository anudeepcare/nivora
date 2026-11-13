"use client";
import { historyBatch } from "@/lib/history-batch";
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
import { invalidateResource, readResource } from "@/lib/resource-cache";
import { amount, dateLabel, percent } from "@/lib/format";
import {
  portfolioComparison,
  type PortfolioPeriod,
} from "@/lib/portfolio-comparison";
import { ChartNoAxesCombined } from "lucide-react";
import { useProduct } from "./Session";
import { portfolioRange } from "@/lib/portfolio-range";
import PortfolioRange from "./PortfolioRange";

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
  const attempted = useRef<{ scope: string; symbols: Set<string> }>({
    scope: "",
    symbols: new Set(),
  });
  const [width, setWidth] = useState(640);
  const [period, setPeriod] = useState<PortfolioPeriod>("3M");
  const [benchmark, setBenchmark] = useState<"SPY" | "QQQ">("SPY");
  const [mode, setMode] = useState<"compare" | "value">("compare");
  const [inspection, setInspection] = useState<number | null>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(220, entry.contentRect.width)),
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
            p.quantity > 0 &&
            quotes[p.symbol]?.quote?.currency === "USD",
        )
        .map((p) => p.symbol),
    ),
  ].sort();
  const key = symbols.join(",");
  useEffect(() => {
    let active = true;
    const saved: WorkspaceHistory = {};
    const selected = key ? [...new Set([...key.split(","), benchmark])] : [];
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
    const scope = `${owner}:${key}:${benchmark}`;
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
        const path = `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=6M`;
        try {
          const result = await readResource(cache, path, 900000, () =>
            // The cache shares in-flight requests. Keep this read alive across
            // benchmark changes; only the active effect may publish UI state.
            api<{ candles: Candle[]; source: string }>(path),
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
    };
  }, [key, cache, demo, owner, revision, benchmark]);
  const chart = useMemo(
    () =>
      portfolioHistory(
        positions,
        quotes,
        history,
        demo
          ? Object.values(demo.research)[0]?.retrievedAt.slice(0, 10)
          : undefined,
        190,
      ),
    [positions, quotes, history, demo],
  );
  const range = useMemo(
    () =>
      portfolioRange(
        positions,
        quotes,
        history,
        demo
          ? Object.values(demo.research)[0]?.retrievedAt.slice(0, 10)
          : undefined,
      ),
    [positions, quotes, history, demo],
  );
  const comparison = useMemo(
    () =>
      portfolioComparison(
        chart.points,
        history[benchmark]?.candles ?? [],
        period,
      ),
    [chart.points, history, benchmark, period],
  );
  useEffect(() => setInspection(null), [comparison, mode]);
  const points = comparison.points;
  const index =
    inspection == null
      ? points.length - 1
      : Math.min(inspection, points.length - 1);
  const selectedPoint = points[index];
  const last = points.at(-1);
  const hasChart = points.length > 1;
  const compare = mode === "compare";
  const showMarket = compare && comparison.comparable;
  const values = points.map((p) => (compare ? p.holdings : p.value));
  const allValues = [
    ...values,
    ...(showMarket ? points.map((p) => p.market!) : []),
    ...(compare ? [0] : []),
  ];
  const low = allValues.length ? Math.min(...allValues) : 0;
  const high = allValues.length ? Math.max(...allValues) : 1;
  const spread = Math.max(high - low, compare ? 2 : high * 0.03, 1);
  const bottom = low - spread * 0.12;
  const top = high + spread * 0.12;
  const left = 52,
    right = width - 14;
  const x = (i: number) =>
    left + (i / Math.max(1, points.length - 1)) * (right - left);
  const y = (v: number) => 232 - ((v - bottom) / (top - bottom)) * 214;
  const line = (rows: number[]) =>
    rows
      .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
      .join(" ");
  const path = line(values);
  const inspect = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    setInspection(
      Math.max(
        0,
        Math.min(
          points.length - 1,
          Math.round(((px - left) / (right - left)) * (points.length - 1)),
        ),
      ),
    );
  };
  const holdingsLabel = chart.excluded.length
    ? "Included holdings"
    : "Your holdings";
  const missingMarket = !!symbols.length && !comparison.comparable;
  const shortDate = (time: string) =>
    new Date(time).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const retryMissing = () => {
    for (const symbol of [
      ...chart.excluded,
      ...(missingMarket ? [benchmark] : []),
    ])
      invalidateResource(
        cache,
        `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=6M`,
      );
    setRevision((r) => r + 1);
  };
  return (
    <>
      <section className={`card portfolio-trend-panel ${styles.panel}`}>
        <div ref={container} className={styles.chart}>
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>
                <ChartNoAxesCombined size={15} aria-hidden="true" /> Price
                perspective
              </span>
              <h2>Holdings vs. the market</h2>
            </div>
            <div className={styles.mode} role="group" aria-label="Chart view">
              <button
                type="button"
                aria-pressed={compare}
                onClick={() => setMode("compare")}
              >
                Compare %
              </button>
              <button
                type="button"
                aria-pressed={!compare}
                onClick={() => setMode("value")}
              >
                Value $
              </button>
            </div>
          </header>
          <div className={styles.toolbar}>
            <label className={styles.benchmark}>
              <span>Market</span>
              <select
                aria-label="Market benchmark"
                value={benchmark}
                onChange={(event) =>
                  setBenchmark(event.target.value as "SPY" | "QQQ")
                }
              >
                <option value="SPY">S&amp;P 500 · SPY</option>
                <option value="QQQ">Nasdaq-100 · QQQ</option>
              </select>
            </label>
            <div
              className={styles.periods}
              role="group"
              aria-label="History period"
            >
              {(["1M", "3M", "6M"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className={styles.coverage} role="status">
            {loading
              ? "Loading price history…"
              : `${chart.included.length} of ${new Set(positions.filter((p) => p.assetType !== "cash").map((p) => p.symbol)).size} holdings included`}
            {chart.excluded.length > 0 && !loading ? " · partial history" : ""}
          </p>
          {hasChart && last && (
            <dl className={styles.totals}>
              <div data-series="holdings">
                <dt>
                  <i aria-hidden="true" />
                  {holdingsLabel}
                </dt>
                <dd>{percent(last.holdings, true)}</dd>
                <small>Price change in view</small>
              </div>
              <div data-series="market">
                <dt>
                  <i aria-hidden="true" />
                  {benchmark === "SPY" ? "S&P 500" : "Nasdaq-100"} · {benchmark}
                </dt>
                <dd>{percent(last.market, true)}</dd>
                <small>
                  {comparison.comparable
                    ? "Same shared dates"
                    : loading
                      ? "Loading market history"
                      : "Comparison unavailable"}
                </small>
              </div>
              <div data-series="difference">
                <dt>Difference</dt>
                <dd>
                  {comparison.excess == null
                    ? "—"
                    : `${comparison.excess > 0 ? "+" : ""}${comparison.excess.toFixed(1)} pp`}
                </dd>
                <small>
                  {comparison.excess == null
                    ? "Needs matching dates"
                    : comparison.excess >= 0
                      ? `Ahead of ${benchmark}`
                      : `Behind ${benchmark}`}
                </small>
              </div>
            </dl>
          )}
          <p className={styles.basisNote}>
            Today’s quantities at past prices. Not your account return.
          </p>
          {hasChart && selectedPoint ? (
            <>
              <div
                className={styles.inspection}
                aria-live="polite"
                aria-atomic="true"
              >
                <time dateTime={selectedPoint.time}>
                  {dateLabel(selectedPoint.time)}
                </time>
                <span data-series="holdings">
                  Holdings{" "}
                  <strong>
                    {compare
                      ? percent(selectedPoint.holdings, true)
                      : amount(selectedPoint.value, "USD")}
                  </strong>
                </span>
                {showMarket && (
                  <span data-series="market">
                    {benchmark}{" "}
                    <strong>{percent(selectedPoint.market, true)}</strong>
                  </span>
                )}
              </div>
              <svg
                viewBox={`0 0 ${width} 274`}
                className={styles.plot}
                role="slider"
                tabIndex={0}
                aria-valuemin={0}
                aria-valuemax={points.length - 1}
                aria-valuenow={index}
                aria-valuetext={`${dateLabel(selectedPoint.time)}: holdings ${compare ? percent(selectedPoint.holdings, true) : amount(selectedPoint.value, "USD")}${showMarket ? `, ${benchmark} ${percent(selectedPoint.market, true)}` : ""}`}
                aria-label={`${compare ? "Price change comparison" : "Historical value of included holdings"}. ${chart.included.join(", ")}. ${points[0].time} to ${last!.time}. Use left and right arrows to inspect. Not account performance.`}
                onPointerMove={inspect}
                onPointerDown={inspect}
                onPointerLeave={(event) => {
                  if (event.pointerType === "mouse") setInspection(null);
                }}
                onFocus={() => setInspection((i) => i ?? points.length - 1)}
                onKeyDown={(event) => {
                  if (
                    ![
                      "ArrowLeft",
                      "ArrowRight",
                      "Home",
                      "End",
                      "Escape",
                    ].includes(event.key)
                  )
                    return;
                  event.preventDefault();
                  setInspection((i) =>
                    event.key === "Escape"
                      ? null
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? points.length - 1
                          : Math.max(
                              0,
                              Math.min(
                                points.length - 1,
                                (i ?? points.length - 1) +
                                  (event.key === "ArrowLeft" ? -1 : 1),
                              ),
                            ),
                  );
                }}
              >
                <defs>
                  <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--portfolio-line)"
                      stopOpacity=".20"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--portfolio-line)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((i) => {
                  const value = bottom + ((top - bottom) * i) / 3;
                  return (
                    <g key={i}>
                      <line
                        x1={left}
                        x2={right}
                        y1={y(value)}
                        y2={y(value)}
                        className={styles.gridLine}
                      />
                      <text
                        x={left - 8}
                        y={y(value) + 4}
                        textAnchor="end"
                        className={styles.axis}
                      >
                        {compare ? percent(value) : amount(value, "USD", true)}
                      </text>
                    </g>
                  );
                })}
                {compare && (
                  <line
                    x1={left}
                    x2={right}
                    y1={y(0)}
                    y2={y(0)}
                    className={styles.zeroLine}
                  />
                )}
                <path
                  d={`${path} L${right} 244 L${left} 244 Z`}
                  fill={`url(#${gradient})`}
                />
                {showMarket && (
                  <path
                    d={line(points.map((p) => p.market!))}
                    className={styles.marketLine}
                  />
                )}
                <path d={path} className={styles.holdingsLine} />
                <circle
                  cx={right}
                  cy={y(values.at(-1)!)}
                  r="4"
                  fill="var(--portfolio-line)"
                />
                {showMarket && (
                  <circle
                    cx={right}
                    cy={y(last!.market!)}
                    r="3"
                    fill="var(--market-line)"
                  />
                )}
                {inspection != null && (
                  <g pointerEvents="none">
                    <line
                      x1={x(index)}
                      x2={x(index)}
                      y1="12"
                      y2="244"
                      className={styles.crosshair}
                    />
                    <circle
                      cx={x(index)}
                      cy={y(values[index])}
                      r="5"
                      fill="var(--portfolio-line)"
                      stroke="var(--card)"
                      strokeWidth="2"
                    />
                    {showMarket && (
                      <circle
                        cx={x(index)}
                        cy={y(selectedPoint.market!)}
                        r="4"
                        fill="var(--market-line)"
                        stroke="var(--card)"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                )}
                <text x={left} y="266" className={styles.axis}>
                  {shortDate(points[0].time)}
                </text>
                <text
                  x={right}
                  y="266"
                  textAnchor="end"
                  className={styles.axis}
                >
                  {shortDate(last!.time)}
                </text>
              </svg>
              <p className={styles.hint}>
                {compare
                  ? "Rebased to 0% on the first date in view."
                  : "Value of the same included holdings, in USD."}{" "}
                Hover, touch or use arrow keys to explore.
              </p>
            </>
          ) : (
            <div className={styles.empty}>
              <ChartNoAxesCombined size={30} aria-hidden="true" />
              <strong>
                {loading
                  ? "Finding shared price history…"
                  : positions.some((p) => p.assetType !== "cash")
                    ? "Not enough shared history in this window"
                    : "Your portfolio takes shape here"}
              </strong>
              <p>
                {positions.some((p) => p.assetType !== "cash")
                  ? "Try a longer period. At least two shared dates of USD prices are needed."
                  : "Add holdings to see their price history, market comparison and allocation."}
              </p>
            </div>
          )}
          {missingMarket && !loading && (
            <p className={styles.unavailable}>
              {benchmark} comparison is unavailable for this window. Your
              available holdings history is still shown.
            </p>
          )}
          <details className={styles.values}>
            <summary>Coverage, sources &amp; data</summary>
            <p>
              Current quantities of{" "}
              {chart.included.join(", ") || "no priced holdings yet"} at
              supplied historical USD prices. Cash, managed balances, margin,
              deposits, trades, dividends and fees are excluded. This is not
              account performance or a total-return comparison.
            </p>
            <p>
              SPY tracks the S&amp;P 500; QQQ tracks the Nasdaq-100. These are
              US equity market references, not risk-matched benchmarks for every
              portfolio or for crypto. Both percentage series use only shared
              observed dates and start at zero on the same date. Missing prices
              are never filled. The actual available dates are shown on the
              chart.
            </p>
            {hasChart && (
              <p>
                Included holdings at their latest quotes:{" "}
                {amount(
                  positions.reduce(
                    (total, p) =>
                      total +
                      (p.assetType !== "cash" &&
                      Number.isFinite(p.quantity) &&
                      p.quantity > 0 &&
                      chart.included.includes(p.symbol)
                        ? p.quantity * (quotes[p.symbol]?.quote?.price || 0)
                        : 0),
                    0,
                  ),
                  "USD",
                )}
                . Historical chart values use the dated close, not the latest
                quote.
              </p>
            )}
            {chart.sources.length > 0 && (
              <p>
                Holdings sources:{" "}
                {[...new Set(chart.sources.map(customerText))].join("; ")}.{" "}
                {history[benchmark]?.source &&
                  `${benchmark}: ${customerText(history[benchmark].source)}.`}
              </p>
            )}
            {chart.excluded.length > 0 && (
              <p>History excluded: {chart.excluded.join(", ")}.</p>
            )}
            {hasChart && (
              <div>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Modeled value</th>
                      <th scope="col">Holdings</th>
                      <th scope="col">{benchmark}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((point) => (
                      <tr key={point.time}>
                        <td>{dateLabel(point.time)}</td>
                        <td>{amount(point.value, "USD")}</td>
                        <td>{percent(point.holdings, true)}</td>
                        <td>{percent(point.market, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
          {!!symbols.length &&
            (!!chart.excluded.length || missingMarket) &&
            !demo && (
              <button
                type="button"
                className={styles.retry}
                disabled={loading}
                onClick={retryMissing}
              >
                {loading
                  ? "Loading available history…"
                  : "Retry missing history"}
              </button>
            )}
        </div>
      </section>
      {!loading && (
        <section className="card portfolio-range-panel">
          <PortfolioRange range={range} />
        </section>
      )}
    </>
  );
}
