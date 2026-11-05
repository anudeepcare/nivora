"use client";
import SectionIcon from "./SectionIcon";
import type { PriceRiskScenarios } from "@/lib/price-risk-scenarios";
import { amount, percent, dateLabel } from "@/lib/format";
import CaseRange from "./CaseRange";
import styles from "./TargetsEstimates.module.css";
export default function PriceRiskCases({
  scenarios: s,
  compact = false,
}: {
  scenarios: Extract<PriceRiskScenarios, { available: true }>;
  compact?: boolean;
}) {
  const cases = s.cases.map((c) => ({
    ...c,
    name:
      c.percentile === 50
        ? "Historical midpoint · 50th percentile"
        : c.percentile < 50 ? `Historical downside · ${c.percentile}th percentile` : `Historical upside · ${c.percentile}th percentile`,
  }));
  return (
    <div className="price-risk-cases" data-compact={compact}>
      <div className="price-risk-label">
        <b>Historical price-risk cases</b>
        <span>{s.horizon} sessions · not fair value</span>
      </div>
      {compact ? (
        <CaseRange
          cases={cases}
          rangeLabel="Historical price outcomes"
          explanation="Past return percentiles applied to the reference price. The median is not an expected future price; these are not valuation targets or forecast probabilities."
          price={s.reference}
          currency={s.currency}
          referenceLabel={
            s.referenceBasis === "settled-close" ? "Settled close" : "Reference"
          }
        />
      ) : (
        <>
          <div className={styles.cases} aria-label="Historical price outcomes">
            {cases.map((c) => (
              <article key={c.percentile}>
                <span>
                  <SectionIcon name={c.name} />
                  {c.name}
                </span>
                <strong>{amount(c.target, s.currency)}</strong>
                <small>{percent(c.change, true)} vs reference</small>
              </article>
            ))}
          </div>
          <p className="price-risk-selected">
            Historical {s.horizon}-session returns applied to{" "}
            {amount(s.reference, s.currency)}. The median is the middle observed
            return, not an expected price or a valuation base case.
          </p>
        </>
      )}
      <details>
        <summary>Basis &amp; limits · {s.samples} historical windows</summary>
        <p>{s.caveat}</p>
        <p>
          Observed history {dateLabel(s.from)}–{dateLabel(s.through)}. Reference{" "}
          {amount(s.reference, s.currency)} · {dateLabel(s.referenceDate)}
          {s.referenceBasis === "settled-close"
            ? " · quote unavailable; latest settled history close used."
            : "."}{" "}
          These cases do not depend on analyst consensus and can all be above or
          below the reference price.
        </p>
      </details>
    </div>
  );
}
