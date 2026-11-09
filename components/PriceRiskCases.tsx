"use client";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { PriceRiskScenarios } from "@/lib/price-risk-scenarios";
import { amount, percent, dateLabel } from "@/lib/format";
import styles from "./PriceRiskCases.module.css";
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
        : c.percentile < 50
          ? `Historical downside · ${c.percentile}th percentile`
          : `Historical upside · ${c.percentile}th percentile`,
  }));
  return (
    <div className={`price-risk-cases ${styles.root}`} data-compact={compact}>
      <div className="price-risk-label">
        <b>Historical price-risk cases</b>
        <span>{s.horizon} sessions · not fair value</span>
      </div>
      <div
        className={styles.cases}
        aria-label="Historical return percentile cases"
      >
        {cases.map((c) => {
          const side =
            c.percentile < 50
              ? "downside"
              : c.percentile > 50
                ? "upside"
                : "midpoint";
          const Icon =
            side === "downside"
              ? ArrowDownRight
              : side === "upside"
                ? ArrowUpRight
                : Minus;
          return (
            <article key={c.percentile} data-case={side}>
              <div className={styles.caseHeading}>
                <span className={styles.caseIcon}>
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span>
                  {side === "midpoint"
                    ? "Historical midpoint"
                    : side === "downside"
                      ? "Historical downside"
                      : "Historical upside"}
                </span>
              </div>
              <span className={styles.percentile}>
                {c.percentile}th percentile
              </span>
              <strong>{amount(c.target, s.currency)}</strong>
              <small>{percent(c.change, true)} vs reference</small>
            </article>
          );
        })}
      </div>
      <p className="price-risk-selected">
        Reference {amount(s.reference, s.currency)} ·{" "}
        {dateLabel(s.referenceDate)}. Historical returns, not forecasts or fair
        value.
      </p>
      <details>
        <summary>Basis &amp; limits · {s.samples} historical windows</summary>
        <p>{s.caveat}</p>
        <p>
          The midpoint is the historical median, not the expected future price.
          Predictive accuracy has not been validated; outcomes can fall outside
          this range. These percentiles describe past returns, not probabilities
          of future prices.
        </p>
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
