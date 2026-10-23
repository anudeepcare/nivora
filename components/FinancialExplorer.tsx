"use client";
import { useMemo, useState } from "react";
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
    [years, setYears] = useState(5),
    [style, setStyle] = useState<"bar" | "line" | "area">("bar");
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
      [
        r.company.symbol,
        r.company.assetType,
        r.company.sector,
        r.evidence?.profile,
      ],
    ),
    chosen = catalog.some((m) => m.key === key)
      ? key
      : (catalog[0]?.key ?? "revenue");
  const series = useMemo(
      () => financialMetricSeries(r, scope, chosen, years),
      [
        r.facts,
        r.retrievedAt,
        r.quote.currency,
        r.company.symbol,
        r.company.assetType,
        r.company.sector,
        r.evidence?.profile,
        scope,
        chosen,
        years,
      ],
    ),
    points = series.points,
    values = points.flatMap((p) => (p.value == null ? [] : [p.value])),
    low = Math.min(0, ...values),
    high = Math.max(0, ...values),
    span = high - low || 1;
  const x = (i: number) => 38 + ((i + 0.5) * 684) / Math.max(1, points.length),
    y = (v: number) => 195 - ((v - low) / span) * 155,
    zero = y(0),
    width = Math.min(42, 450 / Math.max(1, points.length));
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
      className="financial-explorer"
      aria-label="Financial chart explorer"
    >
      <header className="section-head">
        <div>
          <span className="eyebrow">Explore the reported record</span>
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
        Metric
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
                ? series.latest != null && series.latest < 0 ? "Moved from positive to negative" : "Moved from negative to positive"
                : series.change == null
                ? "Change not established"
                : `${series.change > 0 ? "+" : ""}${series.change.toFixed(1)}${series.changeUnit === "pp" ? " pp" : "%"} over shown period`}
            </span>
          </div>
          {values.length ? (
            <svg
              viewBox="0 0 760 240"
              role="img"
              aria-label={`${series.definition?.label} by reported period`}
            >
              <line x1="32" x2="735" y1={zero} y2={zero} stroke="var(--line)" />
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
                      <title>
                        {dateLabel(p.end)}: {format(p.value)}
                      </title>
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
                  {(points.length <= 8 ||
                    i === 0 ||
                    i === points.length - 1 ||
                    i % Math.ceil(points.length / 6) === 0) && (
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
