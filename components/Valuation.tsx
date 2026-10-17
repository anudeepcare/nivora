"use client";
import { useState } from "react";
import type { Research as ResearchData } from "@/lib/types";
import { valuationInputs } from "@/lib/analysis";
import { cashFlowValue } from "@/lib/engine";
import { reverseGrowth } from "@/lib/research-depth";
import { valuationScale } from "@/lib/research-summary";
import { amount, dateLabel, percent } from "@/lib/format";
import { Help, Notice } from "./Ui";
import { TriangleAlert } from "lucide-react";
export default function Valuation({ research: r }: { research: ResearchData }) {
  const input = valuationInputs(r),
    [growth, setGrowth] = useState(0),
    [selectedScenario, setSelectedScenario] = useState<string | null>(null),
    [discount, setDiscount] = useState(10),
    [terminal, setTerminal] = useState(2),
    [dilution, setDilution] = useState(1);
  const estimate = input.eligible
    ? cashFlowValue(
        input.latest!.fcf!,
        input.share!.value,
        growth,
        discount,
        terminal,
        dilution,
      )
    : null;
  return (
    <section>
      <header className="section-heading">
        <div>
          <h2>What assumptions does the price require?</h2>
          <p>
            Explore cash-flow scenarios. Model estimates are separate from
            reported facts.
          </p>
        </div>
        <Help label="Cash-flow scenario">
          Five annual cash flows plus a terminal value, discounted per share.
          Annual dilution applies to each year and the terminal period. This
          exploratory model does not reconcile all financing, acquisitions,
          non-operating assets or future cash claims.
        </Help>
      </header>
      <div className="valuation-context">
        <div>
          <span>Current quote</span>
          <strong>{amount(r.quote.price, r.quote.currency)}</strong>
          <small>{dateLabel(r.quote.asOf)}</small>
        </div>
        <div>
          <span>Operating cash flow − capex · {input.periodBasis}</span>
          <strong>
            {amount(input.latest?.fcf, input.latest?.currency, true)}
          </strong>
          <small>{dateLabel(input.latest?.end)}</small>
        </div>
        <div>
          <span>Outstanding shares</span>
          <strong>
            {input.share
              ? new Intl.NumberFormat("en", {
                  notation: "compact",
                  maximumFractionDigits: 2,
                }).format(input.share.value)
              : "—"}
          </strong>
          <small>{dateLabel(input.share?.end)}</small>
        </div>
      </div>
      {input.eligible ? (
        <>
          <section className="panel">
            <div className="section-heading">
              <h2>Cash-flow examples</h2>
              <Help label="Sensitivity assumptions">
                These −5%, 0% and +5% growth settings are calculator examples,
                not company forecasts or AURYN bear/base/bull price targets.
                Operating cash flow less provider capital expenditure can differ
                from company-reported FCF, including software investment and
                lease payments. Debt financing and other equity claims are not
                fully reconciled.
              </Help>
            </div>
            {r.quote.price != null &&
              input.scenarios.every((s) => s.value != null) &&
              (() => {
                const scale = valuationScale(
                  input.scenarios.map((s) => s.value!),
                  r.quote.price!,
                );
                if (!scale) return null;
                const left = scale.quotePosition;
                return (
                  <>
                    <div
                      className="valuation-track"
                      aria-label="Quote and example estimates on the same price scale"
                    >
                      <span
                        className="valuation-band"
                        aria-hidden="true"
                        style={{
                          left: `${scale.lowPosition}%`,
                          width: `${scale.highPosition - scale.lowPosition}%`,
                        }}
                      />
                      <i
                        className="valuation-marker"
                        style={{ left: `${left}%` }}
                        aria-hidden="true"
                      />
                      <span
                        className="value-pin"
                        style={{
                          left: `${left}%`,
                          transform:
                            left > 75
                              ? "translateX(-100%)"
                              : left < 25
                                ? "none"
                                : "translateX(-50%)",
                        }}
                      >
                        {"Current quote · "}
                        {amount(r.quote.price, r.quote.currency)}
                      </span>
                    </div>
                    <div className="valuation-labels">
                      <span>{amount(scale.min, r.quote.currency)}</span>
                      <span>Shaded area: example estimates</span>
                      <span>{amount(scale.max, r.quote.currency)}</span>
                    </div>
                  </>
                );
              })()}
            <div className="scenarios">
              {input.scenarios.map((s) => (
                <button
                  className={`scenario ${selectedScenario === s.name ? "active" : ""}`}
                  key={s.name}
                  aria-pressed={selectedScenario === s.name}
                  onClick={() => {
                    setSelectedScenario(s.name);
                    setGrowth(s.growth);
                    setDiscount(s.discount);
                    setTerminal(s.terminal);
                    setDilution(1);
                  }}
                >
                  <span>
                    {s.name === "Bear"
                      ? "Contracting cash flow"
                      : s.name === "Base"
                        ? "Flat cash flow"
                        : "Growing cash flow"}
                  </span>
                  <strong>{amount(s.value, r.quote.currency)}</strong>
                  <small>
                    {s.growth}% growth · {s.discount}% discount
                  </small>
                </button>
              ))}
            </div>
          </section>
          <section className="panel support">
            <div className="section-heading">
              <div>
                <h2>Explore your assumptions</h2>
                <p>
                  This calculator changes only your scenario below. The example
                  settings above stay fixed.
                </p>
                <p>
                  Implied five-year annual FCF growth at this quote:{" "}
                  <b>
                    {r.quote.price != null
                      ? percent(
                          reverseGrowth(
                            input.latest!.fcf!,
                            input.share!.value,
                            r.quote.price,
                            discount,
                            terminal,
                            dilution,
                          ),
                        )
                      : "—"}
                  </b>
                </p>
              </div>
              <div className="custom-scenario-result">
                <small>
                  {selectedScenario
                    ? "Selected example"
                    : "Your calculator result"}
                </small>
                <strong className="scenario-value">
                  {amount(estimate, r.quote.currency)}
                </strong>
                <small>Based on the four settings below</small>
              </div>
            </div>
            <div className="assumptions">
              {[
                {
                  label: "Annual cash-flow growth",
                  v: growth,
                  set: setGrowth,
                  min: -30,
                  max: 40,
                },
                {
                  label: "Required annual return",
                  v: discount,
                  set: setDiscount,
                  min: 4,
                  max: 25,
                },
                {
                  label: "Terminal growth",
                  v: terminal,
                  set: setTerminal,
                  min: 0,
                  max: 5,
                },
                {
                  label: "Annual dilution",
                  v: dilution,
                  set: setDilution,
                  min: 0,
                  max: 15,
                },
              ].map((x) => (
                <label key={x.label}>
                  <span>
                    {x.label}
                    <b>{x.v}%</b>
                  </span>
                  <input
                    type="range"
                    min={x.min}
                    max={x.max}
                    step={0.5}
                    value={x.v}
                    onChange={(e) => {
                      setSelectedScenario(null);
                      x.set(Number(e.target.value));
                    }}
                  />
                </label>
              ))}
            </div>
            {discount <= terminal && (
              <Notice error>
                The required return must exceed terminal growth.
              </Notice>
            )}
          </section>
        </>
      ) : (
        <div className="valuation-unavailable">
          <h3>A suitable model needs more evidence.</h3>
          {input.issues.map((i) => (
            <p key={i}>
              <TriangleAlert size={15} />
              {i}
            </p>
          ))}
          <p>
            Reported financials remain available. No fair value is inferred from
            the stock price.
          </p>
        </div>
      )}

      <p className="footnote">
        These scenarios are sensitivity analyses, not analyst targets or a
        verified valuation verdict. Review business-specific economics and model
        assumptions before relying on a per-share estimate.
      </p>
    </section>
  );
}
