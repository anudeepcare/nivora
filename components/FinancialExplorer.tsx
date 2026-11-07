"use client";
import layout from "./FinancialExplorer.module.css";
import { useEffect, useMemo, useState, useRef } from "react";
import type { Research } from "@/lib/types";
import {
  applicableMetrics,
  type FinancialScope,
  type FinancialKey,
} from "@/lib/financial-catalog";
import { financialMetricSeries } from "@/lib/financial-explorer";
import { amount, percent, dateLabel } from "@/lib/format";
export default function FinancialExplorer({
  research: r,
  scope = "annual",
}: {
  research: Research;
  scope?: FinancialScope;
}) {
  const [key, setKey] = useState<FinancialKey>("revenue"),
    [inspected, setInspected] = useState<number | null>(null),
    [years, setYears] = useState(5),
    [style, setStyle] = useState<"bar" | "line" | "area">("bar");
  const plot = useRef<SVGSVGElement>(null);
  const [plotWidth, setPlotWidth] = useState(760);
  useEffect(() => {
    if (!plot.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setPlotWidth(Math.max(280, entry.contentRect.width)),
    );
    observer.observe(plot.current);
    return () => observer.disconnect();
  }, []);
  const catalog = useMemo(
      () =>
        applicableMetrics(r).toSorted(
          (a, b) =>
            [
              "Essentials",
              "Profitability",
              "Cash flow",
              "Balance sheet",
            ].indexOf(a.group) -
            [
              "Essentials",
              "Profitability",
              "Cash flow",
              "Balance sheet",
            ].indexOf(b.group),
        ),
      [r],
    ),
    chosen = catalog.some((m) => m.key === key)
      ? key
      : (catalog[0]?.key ?? "revenue");
  const series = useMemo(
      () => financialMetricSeries(r, scope, chosen, years),
      [r, scope, chosen, years],
    ),
    points = series.points,
    values = points.flatMap((p) => (p.value == null ? [] : [p.value])),
    low = Math.min(0, ...values),
    high = Math.max(0, ...values),
    span = high - low || 1;
  useEffect(() => setInspected(null), [chosen, years, scope, r.company.symbol]);
  const observed =
    inspected == null ? null : points[Math.min(inspected, points.length - 1)];
  const x = (i: number) =>
      62 + ((i + 0.5) * (plotWidth - 85)) / Math.max(1, points.length),
    y = (v: number) => 195 - ((v - low) / span) * 155,
    zero = y(0),
    width = Math.min(
      42,
      ((plotWidth - 85) * 0.65) / Math.max(1, points.length),
    );
  const format = (v: number | null) =>
    v == null
      ? "—"
      : series.unit === "percent"
        ? percent(v)
        : series.unit === "ratio"
          ? `${v.toFixed(2)}×`
          : series.unit === "shares"
            ? new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(v)
            : amount(v, series.currency ?? undefined, true);
  const path = points
    .map((p, i) =>
      p.value == null
        ? ""
        : `${i === 0 || points[i - 1].value == null ? "M" : "L"}${x(i)},${y(p.value)}`,
    )
    .filter(Boolean)
    .join(" ");
  const areas: string[] = [];
  let segment: { i: number; value: number }[] = [];
  const flush = () => {
    if (segment.length) {
      areas.push(
        `M${x(segment[0].i)},${zero} ` +
          segment.map((p) => `L${x(p.i)},${y(p.value)}`).join(" ") +
          ` L${x(segment.at(-1)!.i)},${zero} Z`,
      );
      segment = [];
    }
  };
  points.forEach((p, i) => {
    if (p.value == null) flush();
    else segment.push({ i, value: p.value });
  });
  flush();
  return (
    <section
      className={`financial-explorer depth-explorer ${layout.explorer}`}
      data-metric-group={catalog.find((m) => m.key === chosen)?.group}
      aria-label="Financial chart explorer"
    >
      <header className="section-head">
        <div>
          <span className="eyebrow">Financial history</span>
          <h3>{series.definition?.label ?? "Financial history"}</h3>
          <p>
            {scope === "ttm"
              ? "Rolling twelve months"
              : scope === "quarterly"
                ? "Quarterly"
                : "Annual"}{" "}
            · {series.currency ?? "Currency not supplied"} ·{" "}
            {series.endDate
              ? `through ${dateLabel(series.endDate)}`
              : "No comparable periods"}
          </p>
        </div>
        <div className="explorer-tools">
          <div className="segments" aria-label="Financial chart history">
            {[3, 5, 10, 0].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={years === n}
                onClick={() => setYears(n)}
              >
                {n ? `${n}Y` : "All"}
              </button>
            ))}
          </div>
          <div className="segments" aria-label="Financial chart style">
            {(["bar", "line", "area"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={style === v}
                onClick={() => setStyle(v)}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>
      <label className="explorer-mobile-picker">
        Explore all financial metrics
        <select
          aria-label="Financial chart metric"
          value={chosen}
          onChange={(e) => setKey(e.target.value as FinancialKey)}
        >
          {[...new Set(catalog.map((m) => m.group))].map((g) => (
            <optgroup key={g} label={g}>
              {catalog
                .filter((m) => m.group === g)
                .map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="explorer-body">
        <nav className="explorer-metrics" aria-label="Financial metrics">
          {[...new Set(catalog.map((m) => m.group))].map((g) => (
            <div key={g}>
              <span>{g}</span>
              {catalog
                .filter((m) => m.group === g)
                .map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    aria-pressed={chosen === m.key}
                    onClick={() => setKey(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="explorer-plot">
          <div className="explorer-latest">
            <strong>{format(series.latest)}</strong>
            <span
              className={
                series.change != null && series.change < 0
                  ? "negative"
                  : "positive"
              }
            >
              {series.crossedZero
                ? series.latest != null && series.latest < 0
                  ? "Moved from positive to negative"
                  : "Moved from negative to positive"
                : series.change == null
                  ? "Change not established"
                  : `${series.change > 0 ? "+" : ""}${series.change.toFixed(1)}${series.changeUnit === "pp" ? " pp" : "%"} over shown period`}
            </span>
          </div>
          {values.length > 0 && (
            <p className="explorer-inspection" aria-live="polite">
              {observed
                ? `${dateLabel(observed.end)} · ${observed.value == null ? "No comparable reported value" : format(observed.value)}`
                : "Hover or touch to inspect. Arrow keys move between periods."}
            </p>
          )}
          {values.length ? (
            <svg
              ref={plot}
              viewBox={`0 0 ${plotWidth} 240`}
              preserveAspectRatio="none"
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={points.length - 1}
              aria-valuenow={inspected ?? points.length - 1}
              aria-valuetext={`${dateLabel((observed ?? points.at(-1)!).end)}: ${format((observed ?? points.at(-1)!).value)}`}
              onPointerMove={(event) => {
                const matrix = event.currentTarget.getScreenCTM();
                if (!matrix) return;
                const point = new DOMPoint(
                  event.clientX,
                  event.clientY,
                ).matrixTransform(matrix.inverse());
                setInspected(
                  Math.max(
                    0,
                    Math.min(
                      points.length - 1,
                      Math.floor(
                        ((point.x - 62) / (plotWidth - 85)) * points.length,
                      ),
                    ),
                  ),
                );
              }}
              onFocus={() => setInspected(points.length - 1)}
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
                setInspected((i) =>
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
              style={{ touchAction: "pan-y" }}
              aria-label={`${series.definition?.label} by reported period`}
            >
              {inspected != null && (
                <line
                  x1={x(inspected)}
                  x2={x(inspected)}
                  y1="30"
                  y2="200"
                  stroke="var(--ink)"
                  strokeDasharray="3 3"
                  opacity=".5"
                />
              )}
              {[0, 1, 2, 3].map((index) => {
                const value = low + (span * index) / 3;
                return (
                  <g key={index}>
                    <line
                      x1="60"
                      x2={plotWidth - 15}
                      y1={y(value)}
                      y2={y(value)}
                      stroke="var(--line)"
                      strokeDasharray="3 4"
                    />
                    <text
                      x="54"
                      y={y(value) + 3}
                      textAnchor="end"
                      fontSize="11"
                      fill="var(--muted)"
                    >
                      {format(value)}
                    </text>
                  </g>
                );
              })}
              <line
                x1="60"
                x2={plotWidth - 15}
                y1={zero}
                y2={zero}
                stroke="var(--line)"
              />
              {style === "area" &&
                areas.map((d, i) => (
                  <path key={i} d={d} fill="var(--blue)" opacity=".12" />
                ))}
              {style !== "bar" && (
                <path
                  d={path}
                  fill="none"
                  stroke="var(--blue)"
                  strokeWidth="2.5"
                />
              )}
              {points.map((p, i) => (
                <g key={p.end}>
                  {p.value != null && (
                    <>
                      <title>{`${dateLabel(p.end)}: ${format(p.value)}`}</title>
                      {style === "bar" ? (
                        <rect
                          x={x(i) - width / 2}
                          y={Math.min(y(p.value), zero)}
                          width={width}
                          height={Math.max(1, Math.abs(y(p.value) - zero))}
                          rx="3"
                          fill={p.value < 0 ? "var(--red)" : "var(--blue)"}
                        />
                      ) : (
                        <circle
                          cx={x(i)}
                          cy={y(p.value)}
                          r="3.5"
                          fill="var(--blue)"
                        />
                      )}
                    </>
                  )}
                  {(points.length <= (plotWidth < 500 ? 3 : 8) ||
                    i === 0 ||
                    i === points.length - 1 ||
                    i % Math.ceil(points.length / (plotWidth < 500 ? 2 : 6)) ===
                      0) && (
                    <text
                      x={x(i)}
                      y="224"
                      textAnchor="middle"
                      fill="var(--muted)"
                      fontSize="11"
                    >
                      {p.end.slice(0, 7)}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          ) : (
            <div className="explorer-empty">
              No comparable reported values for this metric and period. Select
              another metric or period; missing observations are not zero.
            </div>
          )}
          <p className="explorer-definition">{series.definition?.help}</p>
          <details className="explorer-explanation">
            <summary>How to read this metric</summary>
            <p>
              {series.unit === "percent"
                ? "Percentages describe a ratio. For example, 20 of operating profit on 100 of revenue is a 20% operating margin. A move from 20% to 25% is 5 percentage points, not 5% growth."
                : series.unit === "ratio"
                  ? "Ratios compare two quantities. For example, 200 of current assets divided by 100 of current liabilities is a current ratio of 2×. Compare businesses with similar accounting and operations."
                  : series.unit === "perShare"
                    ? "Per-share values divide the relevant amount by the applicable share count. For example, 100 of earnings over 50 diluted shares gives earnings per share of 2. Share splits and dilution affect comparisons."
                    : series.unit === "shares"
                      ? "Share counts measure ownership units, not money. Check whether the metric uses outstanding shares or the weighted average for the reporting period."
                      : "Amounts use the displayed reporting currency. K means thousand, M million and B billion. Flow metrics cover a reporting period; balance-sheet amounts describe a reporting date."}
            </p>
            <p>
              Examples illustrate arithmetic, not this company. Gaps mean
              comparable observations are missing. Annualised change requires
              positive endpoints and a valid time interval; it is not a
              forecast.
            </p>
          </details>
          <div className="explorer-statistics">
            <div>
              <span>Start · {series.startDate?.slice(0, 7) ?? "—"}</span>
              <b>{format(series.start)}</b>
            </div>
            <div>
              <span>Latest · {series.endDate?.slice(0, 7) ?? "—"}</span>
              <b>{format(series.latest)}</b>
            </div>
            <div>
              <span>Annualised change</span>
              <b>{percent(series.cagr, true)}</b>
            </div>
          </div>
          <details className="explorer-table">
            <summary>Reported observations</summary>
            <div className="table-scroll">
              <table>
                <caption>
                  {series.definition?.label} · {series.currency ?? series.unit}
                </caption>
                <thead>
                  <tr>
                    <th>Period ended</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.end}>
                      <td>{dateLabel(p.end)}</td>
                      <td>{format(p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              All ranges use available reported periods. Dates, currencies and
              accounting bases remain distinct. Annualised change is withheld
              for ratios, percentages, non-positive endpoints and incomplete
              annual sequences.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
