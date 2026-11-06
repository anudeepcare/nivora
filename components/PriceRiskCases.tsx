"use client";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { PriceRiskScenarios } from "@/lib/price-risk-scenarios";
import { amount, percent, dateLabel } from "@/lib/format";
import { valuationScale } from "@/lib/research-summary";
import styles from "./PriceRiskCases.module.css";
import ScenarioSensitivity from "./ScenarioSensitivity";
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
                <ScenarioSensitivity
                  className={styles.range}
                  target={c.target}
                  reference={s.reference}
                  scale={scale}
                  label={`${c.name}: ${amount(c.target, s.currency)}; reference ${amount(s.reference, s.currency)}`}
                />
              )}
            </article>
          );
        })}
      </div>
      <p className="price-risk-selected">
        Sensitivity diagrams · shared price scale · not a time path. Past{" "}
        {s.horizon}-session returns applied to the reference; not fair values or
        forecasts. The midpoint is the historical median.
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
