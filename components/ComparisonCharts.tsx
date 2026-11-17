"use client";
import { useId, useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { comparisonChart, type ComparisonRange } from "@/lib/comparison-charts";
import { amount, percent } from "@/lib/format";
import styles from "./ComparisonCharts.module.css";
const colors = ["#247653", "#74872b", "#966c21", "#293e34"];
export default function ComparisonCharts({
  research,
}: {
  research: Research[];
}) {
  const [range, setRange] = useState<ComparisonRange>("1y");
  const [selected, setSelected] = useState<string | null>(null);
  const id = useId();
  const chart = useMemo(
    () => comparisonChart(research, range),
    [research, range],
  );
  const index = Math.max(
    0,
    selected && chart.dates.includes(selected)
      ? chart.dates.indexOf(selected)
      : chart.dates.length - 1,
  );
  const all = chart.series.flatMap((s) => s.points.map((p) => p.change));
  const low = Math.min(0, ...all),
    high = Math.max(0, ...all),
    span = high - low || 1;
  const x = (i: number) => 60 + (i / Math.max(1, chart.dates.length - 1)) * 690;
  const y = (v: number) => 230 - ((v - low) / span) * 195;
  return (
    <section className={styles.chart} aria-label="Compare price performance">
      <header>
        <div>
          <span className={styles.eyebrow}>SAME DATES · SAME START</span>
          <h2>Price performance, aligned</h2>
        </div>
        <div className={styles.ranges} aria-label="Shared price chart range">
          {(["1m", "3m", "1y", "5y", "all"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={range === value}
              onClick={() => {
                setRange(value);
                setSelected(null);
              }}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      {chart.available ? (
        <>
          <p className={styles.note}>
            {chart.start} – {chart.end} · {chart.dates.length} shared
            observation dates. Each company starts at 0% on the same date.
          </p>
          <div className={styles.legend}>
            {chart.series.map((s, i) => (
              <span key={s.symbol}>
                <i style={{ background: colors[i] }} />
                {s.symbol} <b>{percent(s.points[index].change, true)}</b>
              </span>
            ))}
          </div>
          <svg
            viewBox="0 0 780 270"
            role="img"
            aria-labelledby={`${id}-title ${id}-description`}
          >
            <title id={`${id}-title`}>Price change over shared dates</title>
            <desc id={`${id}-description`}>
              Use the date control and table below to read exact prices and
              percentage changes for each company. Price-only comparison, not
              total return.
            </desc>
            {[low, (low + high) / 2, high].map((value, i) => (
              <g key={i}>
                <line
                  x1="60"
                  x2="750"
                  y1={y(value)}
                  y2={y(value)}
                  className={styles.gridLine}
                />
                <text x="50" y={y(value) + 4} textAnchor="end">
                  {value.toFixed(1)}%
                </text>
              </g>
            ))}
            <line
              x1="60"
              x2="750"
              y1={y(0)}
              y2={y(0)}
              className={styles.zero}
            />
            {chart.series.map((s, i) => (
              <polyline
                key={s.symbol}
                fill="none"
                stroke={colors[i]}
                strokeWidth="2.5"
                strokeDasharray={i ? `${9 - i * 2} ${i * 2}` : undefined}
                points={s.points
                  .map((p, j) => `${x(j)},${y(p.change)}`)
                  .join(" ")}
              />
            ))}
            <line
              x1={x(index)}
              x2={x(index)}
              y1="25"
              y2="235"
              className={styles.cursor}
            />
            {chart.series.map((s, i) => (
              <circle
                key={s.symbol}
                cx={x(index)}
                cy={y(s.points[index].change)}
                r="4"
                fill={colors[i]}
              />
            ))}
            <text x="60" y="258">
              {chart.start}
            </text>
            <text x="750" y="258" textAnchor="end">
              {chart.end}
            </text>
          </svg>
          <label className={styles.scrubber}>
            Read a shared date <strong>{chart.dates[index]}</strong>
            <input
              type="range"
              min="0"
              max={chart.dates.length - 1}
              value={index}
              aria-label="Shared observation date"
              aria-valuetext={chart.dates[index]}
              onChange={(e) => setSelected(chart.dates[Number(e.target.value)])}
            />
          </label>
          <div className="table-scroll">
            <table>
              <caption>
                Observed closes and price change at {chart.dates[index]}
              </caption>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Starting close</th>
                  <th>Selected close</th>
                  <th>Price change</th>
                </tr>
              </thead>
              <tbody>
                {chart.series.map((s) => (
                  <tr key={s.symbol}>
                    <th>{s.symbol}</th>
                    <td>{amount(s.base, s.currency)}</td>
                    <td>{amount(s.points[index].close, s.currency)}</td>
                    <td>{percent(s.points[index].change, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className={styles.sources}>
            <summary>Price history sources & coverage</summary>
            {chart.series.map((s) => (
              <p key={s.symbol}>
                {s.symbol}: {s.source} · retrieved {s.retrievedAt.slice(0, 10)}{" "}
                · {s.currency || "Currency unspecified"}.
              </p>
            ))}
          </details>
        </>
      ) : (
        <p className={styles.empty} role="status">
          {chart.reason}
        </p>
      )}
      <p className={styles.note}>
        Price-only change in each listing’s currency, not total return.
        Dividends, fees and currency conversion are excluded. The supplied
        closes do not independently establish split-adjustment completeness.
        Only dates observed for every selected company are plotted; gaps are not
        filled. Range ends at the latest shared observation.
      </p>
    </section>
  );
}
