"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { financialTrend, csvRows } from "@/lib/research-workbench";
import { amount, percent, dateLabel } from "@/lib/format";
import { Download } from "lucide-react";
export function downloadCsv(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(
    new Blob([csvRows(rows)], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function ResearchWorkbench({
  research: r,
}: {
  research: Research;
}) {
  const [scope, setScope] = useState<"annual" | "quarterly">("annual");
  const points = useMemo(() => financialTrend(r, scope), [r, scope]);

  const fields = [
    ["revenue", "Revenue", "blue"],
    ["margin", "Operating margin", "violet"],
    ["fcf", "Cash after capex", "green"],
    ["shares", "Diluted shares", "blue"],
  ] as const;
  return (
    <section className="financial-trends" aria-label="Financial trends">
      <header className="section-head">
        <div>
          <span className="eyebrow">Direction over time</span>
          <h3>The business in motion</h3>
        </div>
        <div className="segments" aria-label="Trend period">
          {(["annual", "quarterly"] as const).map((s) => (
            <button
              key={s}
              aria-pressed={scope === s}
              onClick={() => setScope(s)}
            >
              {s === "annual" ? "Annual" : "Quarterly"}
            </button>
          ))}
        </div>
      </header>
      {!points.length && (
        <p className="muted">
          No comparable {scope} financial periods returned. Choose another
          period above.
        </p>
      )}
      <div className="trend-grid">
        {fields.map(([key, label, tone]) => {
          const valid = points.filter(
            (p) => p[key] != null && Number.isFinite(p[key]),
          );
          if (!valid.length) return null;
          const values = valid.map((p) => p[key]!),
            low = Math.min(0, ...values),
            high = Math.max(0, ...values),
            span = high - low || 1;
          const x = (i: number) =>
              16 + (i * 268) / Math.max(1, points.length - 1),
            y = (v: number) => 90 - ((v - low) / span) * 70;
          const path = points
            .map((p, i) =>
              p[key] == null
                ? null
                : `${i === 0 || points[i - 1][key] == null ? "M" : "L"}${x(i)},${y(p[key]!)}`,
            )
            .filter(Boolean)
            .join(" ");
          const latest = points.at(-1)!;
          const value = latest[key];
          return (
            <section className={`trend-card ${tone}`} key={key}>
              <span>{label}</span>
              <strong className="num">
                {key === "margin"
                  ? percent(value)
                  : key === "shares"
                    ? value == null
                      ? "—"
                      : new Intl.NumberFormat("en-US", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(value)
                    : amount(value, latest.currency, true)}
              </strong>
              <svg
                viewBox="0 0 300 106"
                preserveAspectRatio="none"
                role="img"
                aria-label={`${label}, ${points.length} reported ${scope} periods`}
              >
                <line
                  x1="16"
                  x2="284"
                  y1={y(0)}
                  y2={y(0)}
                  stroke="var(--line)"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
                {valid.length === 1 && (
                  <circle
                    cx={x(points.indexOf(valid[0]))}
                    cy={y(values[0])}
                    r="4"
                    fill="currentColor"
                  />
                )}
              </svg>
              <div className="row between small muted">
                <span>{dateLabel(points[0].date)}</span>
                <span>{dateLabel(latest.date)}</span>
              </div>
            </section>
          );
        })}
      </div>
      <details className="research-data-table">
        <summary>Reported values</summary>
        <div className="table-scroll">
          <table>
            <caption>
              {scope === "annual" ? "Annual" : "Quarterly"} periods; currencies
              shown per period. Cash after capex uses operating cash flow less
              capital expenditure.
            </caption>
            <thead>
              <tr>
                <th>Period</th>
                <th>Currency</th>
                {fields.map((f) => (
                  <th key={f[0]}>{f[1]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
                  <td>{p.currency}</td>
                  <td>{amount(p.revenue, p.currency, true)}</td>
                  <td>{percent(p.margin)}</td>
                  <td>{amount(p.fcf, p.currency, true)}</td>
                  <td>{p.shares?.toLocaleString() ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
