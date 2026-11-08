"use client";
import DecisionInsights from "./DecisionInsights";
import AnalystTargets from "./AnalystTargets";
import { consensusOutlook } from "@/lib/outlook";
import SelectedValuation from "./SelectedValuation";
import SectionIcon from "./SectionIcon";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { valueDesk, type DeskMetric } from "@/lib/research-desks";
import { percent, dateLabel } from "@/lib/format";
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
  const available = d.metrics.filter((m) => m.value != null);
  const missing = d.metrics.filter((m) => m.value == null);
  const yields = d.metrics.filter((m) =>
    ["earningsYield", "forwardYield"].includes(m.key),
  );
  const maximum = Math.max(
    10,
    ...yields.flatMap((m) => (m.value == null ? [] : [m.value])),
  );
  return (
    <div className="value-studio depth-value">
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
      {consensusOutlook(r) ? (
        <>
          <AnalystTargets research={r} />
          <details>
            <summary>AURYN model scenarios</summary>
            <SelectedValuation research={r} />
          </details>
        </>
      ) : (
        <SelectedValuation research={r} />
      )}
      <PriceProjection key={r.company.symbol} research={r} />
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
            <small>
              {d.asOf
                ? `Reported ${dateLabel(d.asOf)}`
                : "Observation date not supplied"}
            </small>
          </header>
          <div className="valuation-board-grid">
            {available.map((m) => (
              <article key={m.key} data-tone="neutral">
                <span>{m.label}</span>
                <strong>{display(m)}</strong>
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
      {yields.some((m) => m.value != null) && (
        <details>
          <summary>Earnings yields</summary>
          <section
            className="earnings-yield-view"
            aria-label="Earnings represented per 100 units of equity price"
          >
            <div>
              <span className="eyebrow">A different lens</span>
              <h3>
                <SectionIcon name="Value" />
                For every 100 you pay.
              </h3>
              <p>
                Reported or estimated annual earnings represented by the
                multiple. These amounts are neither cash distributions nor
                expected investment returns.
              </p>
            </div>
            <div className="yield-bars">
              {yields.map((m) => (
                <div key={m.key}>
                  <span>{m.label}</span>
                  <strong>
                    {m.value == null
                      ? "Not available"
                      : `${m.value.toFixed(2)}%`}
                  </strong>
                  <i>
                    <b
                      style={{
                        width: `${m.value == null ? 0 : (m.value / maximum) * 100}%`,
                      }}
                    />
                  </i>
                </div>
              ))}
            </div>
          </section>
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
