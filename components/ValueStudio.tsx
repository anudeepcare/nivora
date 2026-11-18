"use client";
import layout from "./ValueStudio.module.css";
import SentiSenseConsensus from "./SentiSenseConsensus";
import AnalystTargets from "./AnalystTargets";
import SelectedValuation from "./SelectedValuation";
import { scenarioHeadline } from "@/lib/scenario-headline";
import ScenarioLenses from "./ScenarioLenses";
import SectionIcon from "./SectionIcon";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { valueDesk, type DeskMetric } from "@/lib/research-desks";
import { percent } from "@/lib/format";
import { modelAssessment } from "@/lib/model-assessment";
const display = (m: DeskMetric) =>
  m.value == null
    ? "Not available"
    : m.unit === "ratio"
      ? `${m.value.toFixed(1)}×`
      : percent(m.value);
export default function ValueStudio({
  research: r,
  preview = false,
}: {
  research: Research;
  preview?: boolean;
}) {
  const d = useMemo(() => valueDesk(r), [r]);
  const methods = useMemo(() => modelAssessment(r), [r]);
  const headline = useMemo(() => {
    const range = scenarioHeadline(r);
    return range?.source === "history" ? range : null;
  }, [r]);
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
      data-has-consensus={!preview}
    >
      <div className={layout.scenarios}>
        <SelectedValuation research={r} headline={headline} />
      </div>
      {!preview && (
        <div className={layout.consensus}>
          <SentiSenseConsensus
            symbol={r.company.symbol}
            preview={preview}
            fallback={<AnalystTargets research={r} showUnavailable />}
          />
        </div>
      )}
      <div className={layout.crosscheck}>
        <ScenarioLenses research={r} hideSingle excludeAnalyst />
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
      <details className={`value-model-fit ${layout.methods}`}>
        <summary>Model fit & evidence</summary>
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
      </details>
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
