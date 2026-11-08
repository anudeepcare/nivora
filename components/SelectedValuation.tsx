"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { aurynDecision } from "@/lib/auryn-decision";
import { amount, dateLabel, percent } from "@/lib/format";
import s from "./AssessmentSummary.module.css";
/** The selected model is shared with the headline assessment, not a second model. */
export default function SelectedValuation({
  research: r,
}: {
  research: Research;
}) {
  const d = useMemo(
    () =>
      aurynDecision(r, { now: Date.parse(r.priceObservedAt ?? r.retrievedAt) }),
    [r],
  );
  const v = d.valuation;
  return (
    <section className={s.root} aria-label="Selected AURYN valuation model">
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>Model used in the assessment</span>
          <h2>{v?.label ?? "Valuation needs more evidence"}</h2>
          <p>
            {v
              ? v.basis === "cash-flow"
                ? "Present model values from a ten-year cash-flow projection."
                : `Conditional earnings values for ${dateLabel(v.end)}. This is a market-multiple sensitivity, not independent fair value.`
              : "No suitable model has qualified. Analyst consensus and historical price risk remain separate."}
          </p>
        </div>
      </header>
      {v && (
        <>
          <div className={s.reasons}>
            {(["bear", "base", "bull"] as const).map((name) => (
              <div className={s.case} key={name}>
                <span>{name[0].toUpperCase() + name.slice(1)} scenario</span>
                <strong>
                  {amount(v[name], d.reference?.currency ?? r.quote.currency)}
                </strong>
                <small>
                  {d.reference
                    ? percent((v[name] / d.reference.price - 1) * 100, true)
                    : "Reference unavailable"}
                </small>
              </div>
            ))}
          </div>
          <details className={s.assumptions}>
            <summary>See inputs, assumptions & limits</summary>
            <p>{v.assumptions}</p>
            <p>
              Price reference: {amount(d.reference?.price, r.quote.currency)} ·{" "}
              {dateLabel(d.reference?.asOf)}. Financial period:{" "}
              {dateLabel(d.period)}.
            </p>
            <p>
              These are conditional outcomes, not probabilities. Base does not
              mean statistically most likely. Bear can remain above the market
              price.
            </p>
            <p>
              {v.basis === "cash-flow"
                ? "Quote changes affect the percentage gap, not the cash-flow model values when financial inputs and assumptions are unchanged."
                : "The reference multiple comes from market evidence. A refreshed multiple or earnings dataset can change these scenarios even without a new company report."}
            </p>
          </details>
        </>
      )}
    </section>
  );
}
