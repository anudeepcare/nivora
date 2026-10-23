"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { riskBrief } from "@/lib/risk-brief";
import { percent, dateLabel } from "@/lib/format";
export default function AdvancedRiskBrief({
  research: r,
}: {
  research: Research;
}) {
  const b = useMemo(
    () => riskBrief(r),
    [r.history, r.retrievedAt, r.company.assetType],
  );
  if (!b.observations)
    return (
      <section className="risk-brief-empty">
        <h3>Price history is needed for this risk view</h3>
        <p>
          Company results and analyst targets remain available in their own
          tabs. These risk measurements are not filled with assumptions.
        </p>
      </section>
    );
  return (
    <section className="risk-brief" aria-label="Trading risk summary">
      <header>
        <div>
          <span className="eyebrow">Start with the downside</span>
          <h3>What can go wrong before you are right?</h3>
        </div>
        <span className="small muted">
          Completed prices · {dateLabel(b.asOf)}
        </span>
      </header>
      <div className="risk-brief-cards">
        {b.cards.map((c) => (
          <article key={c.key} data-risk={c.key}>
            <span>{c.label}</span>
            <strong>
              {c.value == null ? "History needed" : percent(c.value)}
            </strong>
            <p>{c.note}</p>
          </article>
        ))}
      </div>
      {b.drawdown != null && (
        <div className="risk-brief-drawdown">
          <div>
            <span>Below its highest supplied close</span>
            <strong>{percent(b.drawdown)}</strong>
          </div>
          <p>
            {b.belowPeak} observed sessions below that peak. A large drawdown
            alone does not make a stock cheap, and recovery is not assured.
          </p>
        </div>
      )}
      <p className="context-note">
        {b.observations} supplied completed observations. These describe
        historical price risk—not a forecast or a recommended position size.
      </p>
    </section>
  );
}
