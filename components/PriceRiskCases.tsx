"use client";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { PriceRiskScenarios } from "@/lib/price-risk-scenarios";
import { amount, percent, dateLabel } from "@/lib/format";
import { valuationScale } from "@/lib/research-summary";
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
  const scale = valuationScale(
    cases.map((c) => c.target),
    s.reference,
  );
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
          const targetX = scale
            ? 8 + (284 * (c.target - scale.min)) / (scale.max - scale.min)
            : 0;
          const referenceX = scale ? 8 + 2.84 * scale.quotePosition : 0;
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
              {scale && (
                <svg
                  className={styles.range}
                  viewBox="0 0 300 32"
                  role="img"
                  aria-label={`${c.name}: ${amount(c.target, s.currency)}; reference ${amount(s.reference, s.currency)}. Shared linear price scale.`}
                >
                  <line
                    x1="8"
                    x2="292"
                    y1="16"
                    y2="16"
                    stroke="var(--line)"
                    strokeWidth="2"
                  />
                  <line
                    x1={referenceX}
                    x2={targetX}
                    y1="16"
                    y2="16"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <line
                    x1={referenceX}
                    x2={referenceX}
                    y1="5"
                    y2="27"
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={targetX}
                    cy="16"
                    r="5"
                    fill="currentColor"
                    stroke="var(--surface)"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </article>
          );
        })}
      </div>
      <p className="price-risk-selected">
        Tick: reference {amount(s.reference, s.currency)} · Dot: percentile
        price. Each track uses the same price scale. Past {s.horizon}-session
        returns; not fair values or forecasts. The midpoint is the historical
        median.
      </p>
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
