"use client";
import { useState } from "react";
import type { Research } from "@/lib/types";
import { fundedScenario, type FundedInputs } from "@/lib/funded-scenarios";
import { amount } from "@/lib/format";
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
  const [common, setCommon] = useState<Values>({});
  const [cases, setCases] = useState<Values[]>([{}, {}, {}]);
  const [sources, setSources] = useState(["", "", ""]);
  const [caseIndex, setCaseIndex] = useState(1);
  const currency = r.quote.currency;
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  if (r.company.assetType !== "stock" || coverage.family === "financial")
    return null;
  const results = cases.map((v, i) => {
    const raw = { ...common, ...v };
    if (
      !sources[i].trim() ||
      [...sharedFields, ...caseFields].some(
        ([key]) => raw[key] == null || raw[key]!.trim() === "",
      )
    )
      return null;
    return fundedScenario(
      Object.fromEntries(
        Object.entries(raw).map(([k, value]) => [k, Number(value)]),
      ) as FundedInputs,
    );
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
      className="funded-workbench"
      aria-label="Funded operating scenarios"
    >
      <header>
        <span className="eyebrow">OPERATING SCENARIO WORKBENCH</span>
        <h3>Growth needs funding.</h3>
        <p>
          Separate business outcomes from market opinion. Amounts in {currency},
          whole units. These personal assumptions do not change AURYN’s
          assessment.
        </p>
      </header>
      <div className="funded-results">
        {names.map((name, i) => {
          const result = results[i];
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
                  <p>Future price: {amount(result.terminalPrice, currency)}</p>
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
                    "Funding, operating assumptions and a source note are required."}
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
        <div className="funded-fields">
          {sharedFields.map(([key, label]) => field(key, label, true))}
        </div>
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
          discounted to today; current price is not an input. Scenario names
          carry no probabilities. Inputs are temporary and are cleared when this
          view closes.
        </p>
      </details>
    </section>
  );
}
