"use client";
import { useState } from "react";
import type { PriceRiskScenarios } from "@/lib/price-risk-scenarios";
import { amount, percent, dateLabel } from "@/lib/format";
import CaseRange from "./CaseRange";
export default function PriceRiskCases({
  scenarios: s,
  compact = false,
}: {
  scenarios: Extract<PriceRiskScenarios, { available: true }>;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(1);
  return (
    <div className="price-risk-cases" data-compact={compact}>
      <div className="price-risk-label">
        <b>Historical price-risk cases</b>
        <span>{s.horizon} sessions · not fair value</span>
      </div>
      {compact ? (
        <CaseRange
          cases={s.cases}
          price={s.reference}
          currency={s.currency}
          referenceLabel={
            s.referenceBasis === "settled-close" ? "Settled close" : "Reference"
          }
        />
      ) : (
        <>
          <div className="price-risk-scale">
            <CaseRange
              cases={s.cases}
              price={s.reference}
              currency={s.currency}
              referenceLabel={
                s.referenceBasis === "settled-close"
                  ? "Settled close"
                  : "Reference"
              }
            />
          </div>
          <div
            className="compass-cases"
            role="group"
            aria-label="Explore historical price-risk cases"
          >
            {s.cases.map((c, i) => (
              <button
                type="button"
                key={c.name}
                data-case={c.name}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span>{c.name}</span>
                <strong>{amount(c.target, s.currency)}</strong>
                <small className={c.change < 0 ? "negative" : "positive"}>
                  {percent(c.change, true)}
                </small>
              </button>
            ))}
          </div>
          <p className="price-risk-selected">
            {s.cases[selected].name}:{" "}
            {s.cases[selected].percentile === 50
              ? "median"
              : `${s.cases[selected].percentile}th percentile`}{" "}
            historical {s.horizon}-session price outcome, applied to{" "}
            {amount(s.reference, s.currency)}.
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
