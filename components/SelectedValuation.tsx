"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { Research } from "@/lib/types";
import { aurynDecision } from "@/lib/auryn-decision";
import { amount, dateLabel, percent } from "@/lib/format";
import { researchOutlook } from "@/lib/outlook";
import s from "./SelectedValuation.module.css";
const selectedEnds = new Map<string, string>();
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
/** Shared scenario presentation. Price-anchored cases never alter the decision engine. */
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
  const input = useMemo(
    () =>
      d.reference
        ? {
            ...r,
            quote: {
              ...r.quote,
              price: d.reference.price,
              asOf: d.reference.asOf,
              currency: d.reference.currency,
            },
          }
        : r,
    [r, d.reference],
  );
  const key = r.company.symbol;
  const selected = useSyncExternalStore(
    subscribe,
    () => selectedEnds.get(key) ?? "",
    () => "",
  );
  const ordinary = useMemo(
    () => researchOutlook(input, { fiscalEnd: selected || undefined }),
    [input, selected],
  );
  const projection = useMemo(
    () =>
      ordinary.available
        ? ordinary
        : d.valuation && !selected
          ? ordinary
          : researchOutlook(input, {
              fiscalEnd: selected || undefined,
              priceAnchored: true,
            }),
    [input, selected, ordinary, d.valuation],
  );
  const ends = useMemo(
    () =>
      [...new Set((r.evidence?.estimates ?? []).map((x) => x.date))]
        .sort()
        .filter(
          (end) =>
            researchOutlook(input, { fiscalEnd: end, priceAnchored: true })
              .available,
        ),
    [input, r.evidence?.estimates],
  );
  const v = projection.available
    ? {
        label: "Bear, base & bull",
        basis: projection.basis,
        end: projection.end,
        bear: projection.cases[0].target,
        base: projection.cases[1].target,
        bull: projection.cases[2].target,
        assumptions:
          projection.caveat ?? "Conditional market-multiple sensitivity.",
      }
    : d.valuation;
  if (!v) return null;
  return (
    <section className={s.root} aria-label="Selected AURYN valuation model">
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>AURYN valuation</span>
          <h2>{v?.label ?? "Valuation needs more evidence"}</h2>
          {projection.available && ends.length > 1 && (
            <div
              className={s.years}
              role="group"
              aria-label="Forecast fiscal year"
            >
              {ends.map((end) => (
                <button
                  key={end}
                  aria-pressed={end === projection.end}
                  onClick={() => {
                    selectedEnds.set(key, end);
                    listeners.forEach((fn) => fn());
                  }}
                >
                  FY {end.slice(0, 4)}
                </button>
              ))}
            </div>
          )}
          <p>
            {v
              ? v.basis === "cash-flow"
                ? "Present model values from a ten-year cash-flow projection."
                : `${projection.available && projection.basis === "revenue" ? "Conditional revenue sensitivity" : projection.available && projection.multipleSource === "price-implied" ? "Price-anchored earnings" : "Conditional earnings"} · ${dateLabel(v.end)} · scenario prices, not independent fair value.`
              : "No suitable model has qualified. Analyst consensus and historical price risk remain separate."}
          </p>
        </div>
      </header>
      {v && (
        <>
          <div className={s.reasons}>
            {(["bear", "base", "bull"] as const).map((name) => (
              <div className={s.case} key={name} data-case={name}>
                <span>
                  {name[0].toUpperCase() +
                    name.slice(1) +
                    (v.basis === "cash-flow" ? " model value" : " scenario")}
                </span>
                <strong>
                  {amount(v[name], d.reference?.currency ?? r.quote.currency)}
                </strong>
                <small
                  className={
                    d.reference && v[name] < d.reference.price
                      ? "negative"
                      : undefined
                  }
                >
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
