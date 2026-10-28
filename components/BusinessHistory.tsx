"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { businessHistory } from "@/lib/business-history";
import { amount, percent, dateLabel } from "@/lib/format";
export default function BusinessHistory({
  research: r,
}: {
  research: Research;
}) {
  const h = useMemo(
    () => businessHistory(r),
    [r.facts, r.retrievedAt, r.company.assetType],
  );
  if (!h || !h.periods) return null;
  return (
    <section className="business-history depth-business-history">
      <header className="section-head">
        <div>
          <span className="eyebrow">Business durability</span>
          <h2>What the record actually shows</h2>
          <p>
            {dateLabel(h.start)} – {dateLabel(h.end)} · {h.periods} comparable
            annual periods
          </p>
        </div>
      </header>
      <div className="durability-grid">
        <article data-tone="blue">
          <span>Revenue compounding</span>
          <strong>{percent(h.revenueCagr)}</strong>
          <small>Annualized over the dated, consecutive reporting period</small>
        </article>
        <article data-tone="green">
          <span>Profitable years</span>
          <strong>
            {h.profitObservations
              ? `${h.profitYears} / ${h.profitObservations}`
              : "—"}
          </strong>
          <small>Positive reported net income; observed years only</small>
        </article>
        <article data-tone="violet">
          <span>Cash-generating years</span>
          <strong>
            {h.cashObservations
              ? `${h.cashYears} / ${h.cashObservations}`
              : "—"}
          </strong>
          <small>Positive operating cash less capex</small>
        </article>
        <article
          data-tone={
            h.shareChange != null && h.shareChange > 0 ? "red" : "blue"
          }
        >
          <span>Weighted share change</span>
          <strong>{percent(h.shareChange, true)}</strong>
          <small>
            Reported diluted weighted shares, not a forecast of future dilution
          </small>
        </article>
      </div>
      <div className="business-trend-charts">
        {(
          [
            ["revenue", "Revenue", "blue"],
            ["fcf", "Cash after capex", "green"],
            ["margin", "Operating margin", "violet"],
          ] as const
        ).map(([key, label, tone]) => {
          const values = h.rows
            .map((x) => x[key])
            .filter((v): v is number => v != null && Number.isFinite(v));
          if (!values.length) return null;
          const low = Math.min(0, ...values),
            high = Math.max(0, ...values),
            span = high - low || 1,
            y = (v: number) => 104 - ((v - low) / span) * 77,
            zero = y(0),
            step = 320 / h.rows.length;
          return (
            <figure key={key} data-tone={tone}>
              <figcaption>
                {label}
                <small>{key === "margin" ? "% of revenue" : h.currency}</small>
              </figcaption>
              <svg
                viewBox="0 0 360 136"
                role="img"
                aria-label={`${label} history`}
              >
                <line
                  x1="18"
                  x2="342"
                  y1={zero}
                  y2={zero}
                  stroke="currentColor"
                  opacity=".15"
                />
                {h.rows.map((row, i) => {
                  const value = row[key],
                    x = 20 + step * (i + 0.5);
                  if (value == null || !Number.isFinite(value))
                    return (
                      <text key={row.end} x={x} y="126" textAnchor="middle">
                        {row.end.slice(0, 4)} · —
                      </text>
                    );
                  return (
                    <g key={row.end}>
                      <title>
                        {dateLabel(row.end)}:{" "}
                        {key === "margin"
                          ? percent(value)
                          : amount(value, h.currency ?? undefined, true)}
                      </title>
                      <rect
                        x={x - 13}
                        width="26"
                        y={Math.min(y(value), zero)}
                        height={Math.max(1, Math.abs(y(value) - zero))}
                        rx="3"
                        data-negative={value < 0}
                      />
                      <text
                        x={x}
                        y={
                          value < 0
                            ? Math.min(115, y(value) + 13)
                            : Math.max(13, y(value) - 7)
                        }
                        textAnchor="middle"
                      >
                        {key === "margin"
                          ? percent(value)
                          : amount(value, h.currency ?? undefined, true)}
                      </text>
                      <text x={x} y="132" textAnchor="middle">
                        {row.end.slice(0, 4)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </figure>
          );
        })}
      </div>
      <div className="table-scroll">
        <table>
          <caption>Annual reported evidence · {h.currency}</caption>
          <thead>
            <tr>
              <th>Period</th>
              <th>Revenue</th>
              <th>Operating margin</th>
              <th>Cash after capex</th>
              <th>Weighted shares</th>
            </tr>
          </thead>
          <tbody>
            {h.rows.map((x) => (
              <tr key={x.end}>
                <td>{dateLabel(x.end)}</td>
                <td>{amount(x.revenue, h.currency ?? "USD", true)}</td>
                <td
                  className={x.margin != null && x.margin < 0 ? "negative" : ""}
                >
                  {percent(x.margin)}
                </td>
                <td className={x.fcf != null && x.fcf < 0 ? "negative" : ""}>
                  {amount(x.fcf, h.currency ?? "USD", true)}
                </td>
                <td>
                  {x.shares == null
                    ? "—"
                    : new Intl.NumberFormat(undefined, {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(x.shares)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="context-note">
        Profitability and cash generation are evidence of durability, not proof
        of a moat. Competitive advantages need company-specific disclosures and
        industry context.
      </p>
    </section>
  );
}
