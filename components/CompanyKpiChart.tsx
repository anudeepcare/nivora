"use client";
import { useId, useState } from "react";
import { companyKpiSeries } from "@/lib/company-kpi-chart";
import s from "./CompanyKpiChart.module.css";
export default function CompanyKpiChart({ data }: { data: unknown }) {
  const series = companyKpiSeries(data),
    [chosen, setChosen] = useState<string | null>(null),
    id = useId();
  const selected = series.find((x) => x.key === chosen) ?? series[0];
  if (!selected) return null;
  const points = selected.points,
    last = points.at(-1),
    first = points[0];
  const low = Math.min(0, ...points.map((p) => p.value)),
    high = Math.max(0, ...points.map((p) => p.value));
  const x = (time: number) =>
    70 +
    ((time - (first?.time ?? 0)) /
      Math.max(1, (last?.time ?? 0) - (first?.time ?? 0))) *
      610;
  const y = (value: number) =>
    high === low ? 120 : 210 - ((value - low) / (high - low)) * 180;
  const format = (value: number) =>
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      notation: "compact",
    }).format(value);
  return (
    <section className={s.chart} aria-label="Company metric history">
      <div className={s.heading}>
        <label htmlFor={id}>
          Operating metric
          <select
            id={id}
            value={selected.key}
            onChange={(e) => setChosen(e.target.value)}
          >
            {series.map((v) => (
              <option key={v.key} value={v.key}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <div className={s.value}>
          {last ? (
            <>
              <strong>
                {format(last.value)}{" "}
                <small>{selected.unit ?? "Unit not supplied"}</small>
              </strong>
              <span>
                <time dateTime={last.date}>{last.date}</time> ·{" "}
                {last.estimate ? "Estimate / preliminary" : "Provider-reported"}
              </span>
            </>
          ) : (
            <span>No valid dated values</span>
          )}
        </div>
      </div>
      <div className={s.status}>
        <span className={s.reported}>● Reported</span>
        <span className={s.estimated}>◇ Estimate / preliminary</span>
        {selected.discontinued && <span>Discontinued</span>}
      </div>
      {points.length > 0 ? (
        <svg
          viewBox="0 0 750 250"
          role="img"
          aria-label={`${selected.name}: ${points.length} supplied dated observations, ${selected.unit ?? "unit not supplied"}. No values interpolated.`}
        >
          <title>{selected.name}</title>
          {[...new Set([low, high])].map((v) => (
            <g key={v}>
              <line className={s.grid} x1="70" x2="700" y1={y(v)} y2={y(v)} />
              <text x="62" y={y(v) + 4} textAnchor="end">
                {format(v)}
              </text>
            </g>
          ))}
          {points.map((p, i) => (
            <g key={p.date} className={p.estimate ? s.estimated : s.reported}>
              {selected.kind === "bar" && (
                <rect
                  x={x(p.time) - Math.min(12, 250 / points.length)}
                  y={Math.min(y(0), y(p.value))}
                  width={Math.min(24, 500 / points.length)}
                  height={Math.max(1, Math.abs(y(p.value) - y(0)))}
                  opacity={p.estimate ? 0.4 : 0.75}
                />
              )}
              {selected.kind === "line" && i > 0 && selected.omitted === 0 && (
                <line
                  x1={x(points[i - 1].time)}
                  y1={y(points[i - 1].value)}
                  x2={x(p.time)}
                  y2={y(p.value)}
                  stroke="currentColor"
                  strokeDasharray={
                    p.estimate || points[i - 1].estimate ? "5 4" : undefined
                  }
                  opacity=".5"
                />
              )}
              <circle
                cx={x(p.time)}
                cy={y(p.value)}
                r="4"
                fill={p.estimate ? "var(--surface, white)" : "currentColor"}
                stroke="currentColor"
              >
                <title>{`${p.date}: ${p.value} ${selected.unit ?? ""} · ${p.estimate ? "Estimate" : "Reported"}`}</title>
              </circle>
            </g>
          ))}
          <text x="70" y="240">
            {first?.date}
          </text>
          <text x="680" y="240" textAnchor="end">
            {points.length > 1 ? last?.date : ""}
          </text>
        </svg>
      ) : (
        <p role="status">
          No valid dated observations supplied. See source records below.
        </p>
      )}
      <details className={s.details}>
        <summary>Values & metric details</summary>
        <p>
          {selected.source
            ? `Source citation: ${selected.source}`
            : "Source citation not supplied."}{" "}
          {selected.note}{" "}
          {selected.omitted > 0
            ? `${selected.omitted} missing, conflicting, repeated or invalid observations omitted from chart.`
            : ""}{" "}
          Color identifies reported versus estimated values, not investment
          quality.
        </p>
        <div className={s.table}>
          <table>
            <caption>
              {selected.name} · {selected.unit ?? "unit not supplied"}
            </caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Period</th>
                <th>Value</th>
                <th>Basis</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
                  <td>{p.period ?? "—"}</td>
                  <td>
                    {p.value.toLocaleString("en-US", {
                      maximumSignificantDigits: 15,
                    })}
                  </td>
                  <td>
                    {p.estimate
                      ? "Estimate / preliminary"
                      : "Provider-reported"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
