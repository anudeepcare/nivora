"use client";
import layout from "./ValueStudio.module.css";
import DecisionInsights from "./DecisionInsights";
import AnalystTargets from "./AnalystTargets";
import { consensusOutlook } from "@/lib/outlook";
import SelectedValuation from "./SelectedValuation";
import SectionIcon from "./SectionIcon";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { valueDesk, type DeskMetric } from "@/lib/research-desks";
import { percent } from "@/lib/format";
import PriceProjection from "./PriceProjection";
import { modelAssessment } from "@/lib/model-assessment";
const display = (m: DeskMetric) =>
  m.value == null
    ? "Not available"
    : m.unit === "ratio"
      ? `${m.value.toFixed(1)}×`
      : percent(m.value);
export default function ValueStudio({
  research: r,
  onWorkbench,
}: {
  research: Research;
  onWorkbench: () => void;
}) {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const d = useMemo(() => valueDesk(r), [r]);
  const methods = useMemo(() => modelAssessment(r), [r]);
  const available = d.metrics.filter(
    (m) =>
      m.value != null &&
      !["earningsYield", "forwardYield", "dividendYield"].includes(m.key),
  );
  const missing = d.metrics.filter((m) => m.value == null);
  const yields = d.metrics.filter((m) =>
    ["earningsYield", "forwardYield"].includes(m.key),
  );

  return (
    <div className={`${layout.root} value-studio depth-value`}>
      <header className="desk-heading">
        <div>
          <span className="eyebrow">Value · what the price implies</span>
          <h2>
            <SectionIcon name="Valuation" size={25} />
            Targets & valuation.
          </h2>
        </div>
        <button type="button" className="button" onClick={onWorkbench}>
          Test assumptions →
        </button>
      </header>
      <SelectedValuation research={r} />
      {consensusOutlook(r) && <AnalystTargets research={r} />}
      <details>
        <summary>Build your own scenarios</summary>
        <PriceProjection key={r.company.symbol} research={r} />
      </details>
      {available.length > 0 && (
        <section
          className="valuation-board"
          aria-labelledby="market-pricing-title"
        >
          <header className="section-head">
            <div>
              <span className="eyebrow">Reported market pricing</span>
              <h3 id="market-pricing-title">
                <SectionIcon name="Valuation" />
                What you are paying for
              </h3>
            </div>
          </header>
          <div className="valuation-board-grid">
            {available.map((m) => (
              <article key={m.key} data-tone="neutral">
                <span>{m.label}</span>
                <strong>{display(m)}</strong>
                {["pe", "forwardPe", "trailingPE", "forwardPE"].includes(
                  m.key,
                ) && (
                  <small>
                    {yields.find(
                      (y) =>
                        y.key ===
                        (/forward/i.test(m.key)
                          ? "forwardYield"
                          : "earningsYield"),
                    )?.value != null
                      ? `Earnings yield ${yields.find((y) => y.key === (/forward/i.test(m.key) ? "forwardYield" : "earningsYield"))!.value!.toFixed(2)}%`
                      : ""}
                  </small>
                )}
                <p>{m.note}</p>
              </article>
            ))}
          </div>
          {!!missing.length && (
            <p className="desk-footnote">
              Not supplied or not meaningful:{" "}
              {missing.map((m) => m.label).join(" · ")}. These measures are not
              treated as zero.
            </p>
          )}
        </section>
      )}
      {d.metrics.find((m) => m.key === "dividendYield")?.value != null && (
        <p className="desk-footnote">
          Dividend yield{" "}
          {percent(d.metrics.find((m) => m.key === "dividendYield")!.value)}
        </p>
      )}
      {!available.length && (
        <details className="value-data-note">
          <summary>About the pricing evidence</summary>
          <p className="desk-footnote">
            Reported market multiples are not supplied for this report.
            Available scenarios remain above; missing measures are never treated
            as zero.
          </p>
        </details>
      )}
      <details onToggle={(e) => setCalculatorOpen(e.currentTarget.open)}>
        <summary>Price expectations calculator</summary>
        {calculatorOpen && (
          <DecisionInsights
            research={r}
            now={Date.parse(r.priceObservedAt ?? r.retrievedAt)}
            initialTab={1}
          />
        )}
      </details>
      <section className="value-model-fit">
        <header className="section-head">
          <h3>
            <SectionIcon name="Business" />
            The right lens for this business.
          </h3>
          <span className="eyebrow">Model fit</span>
        </header>
        {methods.methods.map((method) => (
          <div key={method.key}>
            <i data-state={method.status} />
            <div>
              <strong>{method.name}</strong>
              <p>{method.reason}</p>
            </div>
            <span>
              {method.status === "available"
                ? "Available"
                : method.status === "unsuitable"
                  ? "Different model"
                  : "More evidence needed"}
            </span>
          </div>
        ))}
      </section>
      <p className="desk-footnote">
        Multiples are reported observations and can use different dates from the
        quote. A low multiple alone does not establish value.{" "}
        {r.company.assetType === "crypto"
          ? "Corporate earnings multiples do not apply to this instrument."
          : "Review the reporting date, currency and earnings definition before comparing multiples."}
      </p>
    </div>
  );
}
