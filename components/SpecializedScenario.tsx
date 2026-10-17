"use client";
import { useState } from "react";
import { modelCoverage } from "@/lib/research-depth";
import {
  operatingScenario,
  bankScenario,
  type OperatingAssumptions,
} from "@/lib/scenarios";
import type { Research } from "@/lib/types";
import { amount } from "@/lib/format";
import { Source, Help } from "./Ui";
export default function SpecializedScenario({
  research: r,
}: {
  research: Research;
}) {
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
      sector: r.evidence?.profile?.sector || r.company.sector,
      industry: r.evidence?.profile?.industry,
    }),
    [values, setValues] = useState<Record<string, string>>({}),
    [source, setSource] = useState("");
  if (!["frontier", "infrastructure", "financial"].includes(coverage.family))
    return null;
  const bank = coverage.family === "financial",
    fields = bank
      ? [
          ["book", "Tangible book per share"],
          ["roe", "Sustainable return on equity · %"],
          ["cost", "Cost of equity · %"],
          ["growth", "Long-run growth · %"],
        ]
      : [
          [
            "capacity",
            coverage.family === "infrastructure"
              ? "Operating capacity · selected unit"
              : "Deployed commercial units",
          ],
          ["revenuePerUnit", "Annual revenue per unit · USD"],
          ["utilization", "Utilization · %"],
          ["fcfMargin", "FCF margin after sustaining capex · %"],
          ["years", "Years to scenario"],
          ["multiple", "Terminal FCF multiple"],
          ["netDebt", "Future net debt & other claims · USD"],
          ["shares", "Current shares outstanding"],
          ["dilution", "Annual share dilution · %"],
          ["discount", "Required return · %"],
        ];
  const complete = fields.every(
      ([k]) => values[k]?.trim() !== "" && Number.isFinite(Number(values[k])),
    ),
    inputs = Object.fromEntries(fields.map(([k]) => [k, Number(values[k])])),
    result = complete
      ? bank
        ? bankScenario(inputs.book, inputs.roe, inputs.cost, inputs.growth)
        : operatingScenario(inputs as OperatingAssumptions)
      : null,
    value = result
      ? "perShare" in result
        ? result.perShare
        : result.value
      : null;
  return (
    <section className="panel support">
      <header className="section-heading">
        <div>
          <h2>
            {bank ? "Bank economics scenario" : "Operating milestone scenario"}
          </h2>
          <p>
            Your sourced assumptions · separate from the canonical assessment
          </p>
        </div>
        <Help label="Specialized scenario">
          {bank
            ? "A steady-state justified price-to-tangible-book illustration: (ROE minus growth) divided by (cost of equity minus growth). It omits detailed capital, credit and regulatory projections."
            : "A terminal equity scenario: capacity × annual revenue per unit × utilization × cash-flow margin × terminal multiple, less net debt and other claims, divided by diluted shares and discounted to today. Interim cash flows are excluded; funding and dilution must be reflected explicitly."}
        </Help>
      </header>
      <div className="form-grid">
        {fields.map(([k, label]) => (
          <label key={k}>
            {label}
            <input
              type="number"
              step="any"
              value={values[k] ?? ""}
              placeholder="Enter sourced assumption"
              onChange={(e) => setValues({ ...values, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <label>
        Evidence or assumptions source
        <input
          type="url"
          value={source}
          placeholder="https://company-investor-relations…"
          onChange={(e) => setSource(e.target.value)}
        />
      </label>
      <div className="valuation-context support">
        <div>
          <span>Personal scenario per share</span>
          <strong>{amount(value, "USD")}</strong>
          <small>
            {!complete
              ? "Complete the assumptions to calculate"
              : result
                ? "Sensitivity illustration; not a price target"
                : "Assumptions do not support this model"}
          </small>
        </div>
        <div>
          <span>Current quote</span>
          <strong>{amount(r.quote.price, r.quote.currency)}</strong>
        </div>
      </div>
      {source.startsWith("https://") && (
        <Source href={source}>Your assumption source</Source>
      )}
      <p className="footnote">
        Do not mix units. Use USD throughout; capacity and revenue per unit must
        correspond. Planned capacity is not delivered capacity. No probability
        is assigned and these inputs do not change a saved investment thesis.
      </p>
    </section>
  );
}
