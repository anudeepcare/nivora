"use client";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ShieldAlert, Scale, Sparkles, Info } from "lucide-react";
import type { Research } from "@/lib/types";
import { aurynDecision } from "@/lib/auryn-decision";
import { amount, dateLabel, percent } from "@/lib/format";
import { researchOutlook } from "@/lib/outlook";
import { revenueSensitivity } from "@/lib/revenue-sensitivity";
import RevenueSensitivityCases from "./RevenueSensitivityCases";
import s from "./SelectedValuation.module.css";
import dynamic from "next/dynamic";
import { FeatureGate, useAccess } from "./Access";
const FundedScenarios = dynamic(() => import("./FundedScenarios"), {
  loading: () => <p role="status">Opening funding assumptions…</p>,
});
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
  actions,
}: {
  research: Research;
  actions?: ReactNode;
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
              // This usable reference was selected independently of the discarded quote.
              stale: false,
            },
          }
        : r,
    [r, d.reference],
  );
  const { access } = useAccess();
  const key = r.company.symbol;
  const [fundingOpen, setFundingOpen] = useState(false);
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
  const hasValuation = !!v;
  const sensitivity = useMemo(
    () =>
      hasValuation
        ? { available: false as const }
        : revenueSensitivity(input, { fiscalEnd: selected || undefined }),
    [hasValuation, input, selected],
  );
  const recovery = projection.available ? undefined : projection.recovery;
  if (r.company.assetType !== "stock") return null;
  if (!v && sensitivity.available)
    return <RevenueSensitivityCases scenario={sensitivity} actions={actions} />;
  if (!v)
    return (
      <section
        className={s.root}
        aria-label="Selected AURYN valuation model"
        data-state="needs-inputs"
      >
        <header className={s.heading}>
          <div>
            <span className={s.eyebrow}>AURYN valuation</span>
            <h2>Bear, base &amp; bull</h2>
          </div>
          <span className={s.status}>Inputs needed</span>
          {actions}
        </header>
        {!(fundingOpen && recovery && access.features.advanced) && (
          <div className={s.reasons}>
            {(["bear", "base", "bull"] as const).map((name, index) => {
              const Icon = [ShieldAlert, Scale, Sparkles][index];
              return (
                <div className={s.case} key={name} data-case={name}>
                  <span className={s.caseLabel}>
                    <Icon size={17} />
                    {name[0].toUpperCase() + name.slice(1)} scenario
                  </span>
                  <strong aria-label={`${name} target not calculated`}>
                    —
                  </strong>
                  <small>Not calculated</small>
                </div>
              );
            })}
          </div>
        )}
        <div className={s.missing} role="status">
          <Info size={17} />
          <div>
            <strong>{recovery?.title ?? "Scenario inputs need review"}</strong>
            <p>
              {projection.available
                ? "No supported valuation model is available."
                : projection.reason}
            </p>
            <small>
              Wall Street consensus remains separate. Missing inputs are not
              treated as zero.
            </small>
          </div>
        </div>
        {recovery && (
          <div className={s.recovery}>
            <p>{recovery.detail}</p>
            <button
              type="button"
              className="button"
              aria-expanded={fundingOpen}
              onClick={() => setFundingOpen(!fundingOpen)}
            >
              {fundingOpen
                ? "Close funding assumptions"
                : "Build funding assumptions"}
            </button>
            {fundingOpen && (
              <FeatureGate feature="advanced">
                <p>
                  Personal, conditional scenarios — not automatic AURYN targets.
                  Reconcile company facts and supply your own funding
                  assumptions before calculating.
                </p>
                <FundedScenarios
                  key={`${r.company.symbol}:${r.quote.currency}`}
                  research={r}
                />
              </FeatureGate>
            )}
          </div>
        )}
      </section>
    );
  const reference = d.reference?.price;
  const prices = [v.bear, v.base, v.bull, ...(reference ? [reference] : [])];
  const low = Math.min(...prices),
    high = Math.max(...prices);
  const position = (price: number) =>
    6 + (88 * (price - low)) / (high - low || 1);
  return (
    <section className={s.root} aria-label="Selected AURYN valuation model">
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>AURYN valuation</span>
          <h2>Bear, base &amp; bull</h2>
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
        {actions}
      </header>
      {v && (
        <>
          <div className={s.reasons}>
            {(["bear", "base", "bull"] as const).map((name) => (
              <div className={s.case} key={name} data-case={name}>
                <span className={s.caseLabel}>
                  {name === "bear" ? (
                    <ShieldAlert size={17} />
                  ) : name === "base" ? (
                    <Scale size={17} />
                  ) : (
                    <Sparkles size={17} />
                  )}
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
                {projection.available &&
                  (() => {
                    const input = projection.cases.find(
                      (x) => x.name.toLowerCase() === name,
                    );
                    return input ? (
                      <p className={s.caseInput}>
                        {input.eps != null ? (
                          <>
                            EPS {amount(input.eps, projection.currency)}{" "}
                            <span>×</span> {input.multiple.toFixed(1)}× P/E
                          </>
                        ) : input.revenue != null ? (
                          <>
                            Revenue{" "}
                            {amount(input.revenue, projection.currency, true)} ·{" "}
                            {input.multiple.toFixed(1)}× EV/revenue
                          </>
                        ) : null}
                      </p>
                    ) : null;
                  })()}
              </div>
            ))}
          </div>
          <div
            className={s.priceMap}
            role="img"
            aria-label={`Bear ${amount(v.bear, r.quote.currency)}, base ${amount(v.base, r.quote.currency)}, bull ${amount(v.bull, r.quote.currency)}${reference ? `; current ${amount(reference, r.quote.currency)}` : ""}`}
          >
            <div className={s.rail}>
              {(["bear", "base", "bull"] as const).map((name) => (
                <i
                  key={name}
                  className={s.point}
                  data-side={name}
                  style={{ left: `${position(v[name])}%` }}
                />
              ))}
              {reference && (
                <span
                  className={s.now}
                  style={{ left: `${position(reference)}%` }}
                >
                  <i />
                  <small>Current {amount(reference, r.quote.currency)}</small>
                </span>
              )}
            </div>
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
