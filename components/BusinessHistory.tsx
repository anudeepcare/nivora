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
  const h = useMemo(() => businessHistory(r), [r]);
  if (!h || !h.periods) return null;
  return (
    <section className="business-history panel">
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
