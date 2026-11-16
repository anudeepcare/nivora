"use client";
import DetailDialog from "./DetailDialog";
import layout from "./ValueStudio.module.css";
import DecisionInsights from "./DecisionInsights";
import AnalystTargets from "./AnalystTargets";
import { consensusOutlook } from "@/lib/outlook";
import StockPillars from "./StockPillars";
import { aurynDecision } from "@/lib/auryn-decision";
import ScenarioLenses from "./ScenarioLenses";
import SectionIcon from "./SectionIcon";
import { Help } from "./Ui";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { valueDesk, type DeskMetric } from "@/lib/research-desks";
import { percent } from "@/lib/format";
import PriceProjection from "./PriceProjection";
import TargetsEstimates from "./TargetsEstimates";
import { modelAssessment } from "@/lib/model-assessment";
const display = (m: DeskMetric) =>
  m.value == null
    ? "Not available"
    : m.unit === "ratio"
      ? `${m.value.toFixed(1)}×`
      : percent(m.value);
export default function ValueStudio({ research: r }: { research: Research }) {
  const [projectionOpened, setProjectionOpened] = useState(false);
  const d = useMemo(() => valueDesk(r), [r]);
  const consensus = useMemo(() => consensusOutlook(r), [r]);
  // A complete range is already shown by StockPillars. Keep a separate
  // consensus card only when it adds an observation with missing bounds.
  const showConsensus =
    !!consensus && (consensus.low == null || consensus.high == null);
  const methods = useMemo(() => modelAssessment(r), [r]);
  const decision = useMemo(
    () =>
      aurynDecision(r, { now: Date.parse(r.priceObservedAt ?? r.retrievedAt) }),
    [r],
  );
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
    <div
      className={`${layout.root} value-studio depth-value`}
      data-has-consensus={showConsensus}
    >
      <section className={layout.calculator} aria-label="What the price needs">
        <DecisionInsights
          research={r}
          now={Date.parse(r.priceObservedAt ?? r.retrievedAt)}
          initialTab={1}
          embedded
        />
      </section>
      <div className={layout.scenarios}>
        <StockPillars research={r} decision={decision} casesOnly />
        {showConsensus && (
          <div className={layout.consensus}>
            <AnalystTargets research={r} embedded />
          </div>
        )}
        <DetailDialog
          title="Compare model ranges"
          trigger="Compare model ranges"
          wide
        >
          <ScenarioLenses research={r} decision={decision} />
        </DetailDialog>
      </div>
      {available.length > 0 && (
        <section
          className={`valuation-board ${layout.market}`}
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
          <div className={layout.multipleRows}>
            {available.map((m) => (
              <article key={m.key} data-tone="neutral" data-metric={m.key}>
                <span>
                  <Help label={m.label} trigger={m.label}>
                    {m.note}
                  </Help>
                </span>
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
              </article>
            ))}
          </div>

          {!!missing.length && (
            <Help label="Unavailable pricing measures">
              Not supplied or not meaningful:{" "}
              {missing.map((m) => m.label).join(" · ")}. These measures are not
              treated as zero.
            </Help>
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
        <DetailDialog
          title="Pricing evidence"
          trigger="About the pricing evidence"
        >
          <p className="desk-footnote">
            Reported market multiples are not supplied for this report.
            Available scenarios remain above; missing measures are never treated
            as zero.
          </p>
        </DetailDialog>
      )}
      <DetailDialog
        title="Model fit & evidence"
        trigger="Model fit & evidence"
        className={layout.methods}
        wide
      >
        <div className={layout.methodGrid}>
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
        </div>
      </DetailDialog>
      <DetailDialog
        title="Estimate scenarios & historical price risk"
        trigger="Estimate scenarios & historical price risk"
        wide
      >
        <TargetsEstimates research={r} initialView={2} modelViewsOnly />
      </DetailDialog>
      <details
        className={layout.manual}
        onToggle={(event) => {
          if (event.currentTarget.open) setProjectionOpened(true);
        }}
      >
        <summary>Build your own price projection</summary>
        {projectionOpened && (
          <PriceProjection key={r.company.symbol} research={r} />
        )}
      </details>
      <Help label="Pricing dates and limitations">
        Multiples are reported observations and can use different dates from the
        quote. A low multiple alone does not establish value.{" "}
        {r.company.assetType === "crypto"
          ? "Corporate earnings multiples do not apply to this instrument."
          : "Review the reporting date, currency and earnings definition before comparing multiples."}
      </Help>
    </div>
  );
}
