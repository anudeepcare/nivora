"use client";
import { useState } from "react";
import type { Research as ResearchData } from "@/lib/types";
import { valuationInputs } from "@/lib/analysis";
import { cashFlowValue } from "@/lib/engine";
import { reverseGrowth } from "@/lib/research-depth";
import { amount, dateLabel, percent } from "@/lib/format";
import { Help, Notice } from "./Ui";
import { TriangleAlert } from "lucide-react";
import SpecializedScenario from "./SpecializedScenario";
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
          <span>Reported annual FCF</span>
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
              <h2>Explore the valuation range</h2>
              <span className="muted small">Five-year cash-flow scenarios</span>
            </div>
            {r.quote.price != null &&
              input.scenarios.every((s) => s.value != null) &&
              (() => {
                const values = input.scenarios.map((s) => s.value!),
                  low = Math.min(...values),
                  high = Math.max(...values);
                const left =
                  high > low
                    ? Math.max(
                        5,
                        Math.min(
                          95,
                          5 + (90 * (r.quote.price! - low)) / (high - low),
                        ),
                      )
                    : 50;
                return (
                  <>
                    <div className="valuation-track">
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
                        {r.quote.price! > high
                          ? "Above range · "
                          : r.quote.price! < low
                            ? "Below range · "
                            : "Price "}
                        {amount(r.quote.price, r.quote.currency)}
                      </span>
                    </div>
                    <div className="valuation-labels">
                      <span>{amount(low, r.quote.currency)}</span>
                      <span>Scenario range</span>
                      <span>{amount(high, r.quote.currency)}</span>
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
                  <span>{s.name} scenario</span>
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
                <h2>Your assumptions</h2>
                <p>Changes update this scenario immediately.</p>
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
              <strong className="scenario-value">
                {amount(estimate, r.quote.currency)}
              </strong>
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
      <SpecializedScenario research={r} />
      <p className="footnote">
        These scenarios are sensitivity analyses, not analyst targets or a
        verified valuation verdict. Review business-specific economics and model
        assumptions before relying on a per-share estimate.
      </p>
    </section>
  );
}
