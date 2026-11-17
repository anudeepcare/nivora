"use client";
import { useState } from "react";
import type { Research } from "@/lib/types";
import {
  fundedScenario,
  impliedFundedMultiple,
  type FundedInputs,
} from "@/lib/funded-scenarios";
import { amount, dateLabel, percent } from "@/lib/format";
import { latestFinancialEvidence } from "@/lib/analysis";
import {
  scenarioStartingValues,
  operatingScenarioSupported,
} from "@/lib/scenario-inputs";
import styles from "./FundedScenarios.module.css";
import { modelCoverage } from "@/lib/research-depth";
const sharedFields: [keyof FundedInputs, string][] = [
  ["startRevenue", "Starting annual revenue"],
  ["cash", "Starting cash"],
  ["debt", "Starting debt"],
  ["shares", "Current shares"],
  ["years", "Years · whole number"],
  ["discountRate", "Required annual return · %"],
];
const caseFields: [keyof FundedInputs, string][] = [
  ["terminalRevenue", "Terminal annual revenue"],
  ["ocfMargin", "Operating cash margin · %"],
  ["ebitdaMargin", "Terminal EBITDA margin · %"],
  ["totalCapex", "Total capex over horizon"],
  ["newDebt", "New debt raised at start"],
  ["debtRate", "New debt interest rate · %"],
  ["equityRaised", "Equity capital raised at start"],
  ["issuePrice", "Equity issue price per share"],
  ["annualDilution", "Additional annual dilution · %"],
  ["exitEbitdaMultiple", "Terminal EV/EBITDA · ×"],
];
type Values = Partial<Record<keyof FundedInputs, string>>;
const names = ["Bear", "Base", "Bull"] as const;
export default function FundedScenarios({
  research: r,
}: {
  research: Research;
}) {
  const [financial] = useState(() => latestFinancialEvidence(r));
  const [shareObservation] = useState(
    () => r.evidence?.listingObservations?.shares.asOf,
  );
  const starting = scenarioStartingValues(
    financial.latest,
    r.quote.currency,
    r.evidence?.ownership?.outstanding,
  );
  const [common, setCommon] = useState<Values>(() => starting);
  const [confirmed, setConfirmed] = useState(false);
  const [cases, setCases] = useState<Values[]>([{}, {}, {}]);
  const [sources, setSources] = useState(["", "", ""]);
  const [caseIndex, setCaseIndex] = useState(1);
  const currency = r.quote.currency;
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  if (!operatingScenarioSupported(r.company.assetType, coverage.family))
    return (
      <section className="workbench-empty">
        <h3>A sector-specific capital model is needed.</h3>
        <p>
          This operating-company funding model does not support financial
          companies, insurers, real estate companies or crypto. No generic bear,
          base or bull valuation is assigned.
        </p>
      </section>
    );
  const inputsByCase: (FundedInputs | null)[] = [];
  const results = cases.map((v, i) => {
    const raw = { ...common, ...v };
    if (
      !confirmed ||
      !sources[i].trim() ||
      [...sharedFields, ...caseFields].some(
        ([key]) => raw[key] == null || raw[key]!.trim() === "",
      )
    ) {
      inputsByCase.push(null);
      return null;
    }
    const inputs = Object.fromEntries(
      Object.entries(raw).map(([k, value]) => [k, Number(value)]),
    ) as FundedInputs;
    inputsByCase.push(inputs);
    return fundedScenario(inputs);
  });
  const field = (key: keyof FundedInputs, label: string, shared: boolean) => {
    const values = shared ? common : cases[caseIndex];
    return (
      <label key={key}>
        {label}
        <input
          type="number"
          step={key === "years" ? "1" : "any"}
          value={values[key] ?? ""}
          placeholder="Explicit assumption"
          onChange={(e) =>
            shared
              ? setCommon({ ...common, [key]: e.target.value })
              : setCases(
                  cases.map((v, i) =>
                    i === caseIndex ? { ...v, [key]: e.target.value } : v,
                  ),
                )
          }
        />
      </label>
    );
  };
  return (
    <section
      className={`funded-workbench ${styles.workbench}`}
      aria-label="Funded operating scenarios"
    >
      <header>
        <span className="eyebrow">OPERATING SCENARIO WORKBENCH</span>
        <h3>Growth needs funding.</h3>
        <p>
          Separate business outcomes from market opinion. Amounts in {currency},
          whole units. These personal assumptions do not change AURYN’s
          assessment. Scenarios are not probabilities or validated forecasts.
        </p>
      </header>
      <div className="funded-results">
        {names.map((name, i) => {
          const result = results[i];
          const inputs = inputsByCase[i];
          const implied =
            inputs && r.quote.price != null
              ? impliedFundedMultiple(inputs, r.quote.price)
              : null;
          return (
            <article key={name} data-case={name}>
              <span>{name}</span>
              <strong>
                {result?.available
                  ? amount(result.presentValue, currency)
                  : "—"}
              </strong>
              <small>Present value · personal assumptions</small>
              {result?.available ? (
                <>
                  <p>
                    Terminal equity / share:{" "}
                    {amount(result.terminalPrice, currency)}
                  </p>
                  <p>
                    Share count increase:{" "}
                    {percent(
                      (result.endingShares / Number(common.shares) - 1) * 100,
                    )}
                  </p>
                  <p>
                    Price-implied terminal EV/EBITDA:{" "}
                    {implied == null
                      ? "Outside supported bounds"
                      : `${implied.toFixed(1)}×`}
                  </p>
                  <small>
                    Ending cash {amount(result.endingCash, currency, true)} ·
                    debt {amount(result.endingDebt, currency, true)} ·{" "}
                    {result.endingShares.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    shares
                  </small>
                </>
              ) : (
                <p>
                  {result?.reason ??
                    "Reconcile starting facts, then complete funding assumptions and a source note."}
                </p>
              )}
            </article>
          );
        })}
      </div>
      <details>
        <summary>Build and inspect the three cases</summary>
        <p>
          No assumptions are copied from the current market multiple. Enter zero
          explicitly where appropriate; blank is unknown.
        </p>
        <p className="desk-footnote">
          Starting monetary facts: {financial.periodBasis} ending{" "}
          {dateLabel(financial.latest?.end)}
          {financial.latest?.filed
            ? ` · filed ${dateLabel(financial.latest.filed)}`
            : " · filing date unavailable"}
          .
          {financial.latest?.currency !== currency
            ? " Reporting and quote currencies differ; monetary starting values are left blank."
            : " Historical starting facts are editable; they are not current forecasts."}{" "}
          Outstanding shares observation:{" "}
          {shareObservation
            ? dateLabel(shareObservation)
            : "date unavailable; verify against the latest filing"}
          .
          {financial.latest?.sourceUrl?.startsWith("https://") && (
            <>
              {" "}
              <a
                href={financial.latest.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Review financial source
              </a>
            </>
          )}
        </p>
        <div className="funded-fields">
          {sharedFields.map(([key, label]) => field(key, label, true))}
        </div>
        <label className={styles.confirm}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            I reconciled the reporting currency, current shares and any ADR
            ratio to this quote. Future assumptions and financing terms are
            mine.
          </span>
        </label>
        <div className="au-segment" role="group" aria-label="Edit scenario">
          {names.map((name, i) => (
            <button
              key={name}
              aria-pressed={caseIndex === i}
              onClick={() => setCaseIndex(i)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="funded-fields">
          {caseFields.map(([key, label]) => field(key, label, false))}
        </div>
        <label>
          Source and rationale for {names[caseIndex]} assumptions
          <textarea
            value={sources[caseIndex]}
            onChange={(e) =>
              setSources(
                sources.map((s, i) => (i === caseIndex ? e.target.value : s)),
              )
            }
            placeholder="Filing date, operating milestones, funding terms and your assumptions"
          />
        </label>
        <p className="context-note">
          Model limits: revenue follows a smooth annual path; OCF margin
          includes working capital, taxes and existing-debt interest. Capex is
          spread evenly. New financing occurs at the start; new debt interest is
          paid annually. No debt repayments, dividends or interim distributions
          are assumed. Terminal EBITDA must be positive. Future equity value is
          discounted to today. The price-implied terminal multiple holds each
          funded path fixed and solves for the multiple supporting the reference
          quote of {amount(r.quote.price, currency)} as of{" "}
          {dateLabel(r.quote.asOf)}
          {r.quote.stale ? " (older quote)" : ""}; it does not change the
          scenario value. Scenario names carry no probabilities. Inputs are
          temporary and are cleared when this view closes.
        </p>
      </details>
    </section>
  );
}
