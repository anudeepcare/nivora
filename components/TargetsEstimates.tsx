"use client";
import { useId, useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { researchOutlook } from "@/lib/outlook";
import { targetsEstimates } from "@/lib/targets-estimates";
import { amount, dateLabel, percent } from "@/lib/format";
import AnalystTargets from "./AnalystTargets";
import EstimateRevisions from "./EstimateRevisions";
import PriceRiskCases from "./PriceRiskCases";
import SelectedValuation from "./SelectedValuation";
import styles from "./TargetsEstimates.module.css";

const tabs = [
  "Analyst targets",
  "Annual estimates",
  "Conditional valuation",
  "Historical price risk",
] as const;
export default function TargetsEstimates({
  research: r,
}: {
  research: Research;
}) {
  const model = useMemo(() => targetsEstimates(r), [r]);
  const [active, setActive] = useState(0);
  const id = useId();
  const [multipleInput, setMultipleInput] = useState({
    symbol: r.company.symbol,
    value: "",
  });
  const multipleValue =
    multipleInput.symbol === r.company.symbol ? multipleInput.value : "";
  const forecast = useMemo(
    () =>
      multipleValue.trim()
        ? researchOutlook(r, { earningsMultiple: Number(multipleValue) })
        : model.forecast,
    [r, model.forecast, multipleValue],
  );
  return (
    <section className={styles.root} aria-label="Targets and estimates">
      <header className={styles.header}>
        <div>
          <span className="eyebrow">Expectations & assumptions</span>
          <h2>Targets & Estimates</h2>
        </div>
      </header>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Target and estimate views"
      >
        {tabs.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next != null) {
                event.preventDefault();
                setActive(next);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={styles.panel}
        role="tabpanel"
        id={`${id}-panel-${active}`}
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
      >
        {active === 0 && (
          <>
            <AnalystTargets research={r} showUnavailable />
          </>
        )}
        {active === 1 && (
          <>
            <div className={styles.subhead}>
              <h3>Annual EPS & revenue consensus</h3>
              <span>
                {r.evidence?.source ?? "Estimate provider"} · updated{" "}
                {dateLabel(model.asOf)}
              </span>
            </div>
            {model.estimates.length ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Fiscal period / end</th>
                      <th>EPS consensus</th>
                      <th>Revenue consensus</th>
                      <th>EPS analysts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.estimates.map((row) => (
                      <tr key={`${row.date}-${row.currency}`}>
                        <th scope="row">
                          {row.period}
                          <small>
                            {dateLabel(row.date)} · {row.currency}
                          </small>
                        </th>
                        <td>
                          {amount(row.eps, row.currency!)}
                          <small>
                            {row.epsRange
                              ? `${amount(row.epsRange.low, row.currency!)} – ${amount(row.epsRange.high, row.currency!)}`
                              : "Low/high unavailable"}
                          </small>
                        </td>
                        <td>
                          {amount(row.revenue, row.currency!, true)}
                          <small>
                            {row.revenueRange
                              ? `${amount(row.revenueRange.low, row.currency!, true)} – ${amount(row.revenueRange.high, row.currency!, true)}`
                              : "Low/high unavailable"}
                          </small>
                        </td>
                        <td>{row.analysts ?? "Not supplied"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.empty}>{model.estimatesReason}</p>
            )}
            <details className={styles.assumptions}>
              <summary>Estimate coverage</summary>
              <p className={styles.note}>
                Ranges are provider-reported estimates. Analyst counts refer to
                EPS coverage; revenue contributor counts are not supplied.
                Fiscal periods may be awaiting results. Relative provider labels
                use the year of the period end. EPS accounting and split basis
                are not independently verified.
              </p>
            </details>
            <EstimateRevisions research={r} />
          </>
        )}
        {active === 2 && (
          <>
            <div className={styles.subhead}>
              <h3>Earnings scenarios</h3>
              <span>Conditional assumptions · not analyst price targets</span>
            </div>

            <details className={styles.assumptions}>
              <summary>Adjust P/E assumption</summary>
              <p className={styles.note}>
                Source: {r.evidence?.source ?? "Estimate provider"} · dataset
                updated {dateLabel(model.asOf)}. Reported forward P/E:{" "}
                {r.evidence?.multiples?.ForwardPE != null
                  ? `${r.evidence.multiples.ForwardPE.toFixed(1)}×`
                  : "not supplied"}
                . Forecast horizon: nearest eligible three-year estimate. EPS
                period and split basis need verification.
              </p>
              <label className={styles.control}>
                Your exit P/E assumption (earnings cases only)
                <input
                  type="number"
                  min="0.1"
                  max="500"
                  step="0.1"
                  placeholder="Use checked provider P/E"
                  value={multipleValue}
                  onChange={(event) =>
                    setMultipleInput({
                      symbol: r.company.symbol,
                      value: event.target.value,
                    })
                  }
                />
              </label>
              {multipleValue && (
                <button
                  type="button"
                  onClick={() =>
                    setMultipleInput({ symbol: r.company.symbol, value: "" })
                  }
                >
                  Reset to checked provider P/E
                </button>
              )}
              <p className={styles.note}>
                Low / central / high cases use 0.8× / 1.0× / 1.2× this multiple.
                Your assumption does not change analyst consensus.
              </p>
            </details>
            {!multipleValue ? (
              <SelectedValuation research={r} />
            ) : forecast.available ? (
              <>
                <p>
                  {forecast.multipleSource === "user-assumption"
                    ? "Your P/E assumption · "
                    : ""}
                  {forecast.period} · ends {dateLabel(forecast.end)} · estimates
                  updated {dateLabel(forecast.asOf)} · {forecast.currency} ·{" "}
                  {forecast.analysts ?? "Unknown"} EPS analysts
                </p>
                {forecast.basis === "earnings" && (
                  <p className={styles.note}>
                    Exit P/E: {forecast.forwardPE.toFixed(1)}× ·{" "}
                    {forecast.multipleSource === "user-assumption"
                      ? "your assumption"
                      : `provider multiple checked against ${forecast.multipleReferencePeriod ?? "nearest annual EPS"}`}
                    . Quote reference {dateLabel(r.quote.asOf)} ·{" "}
                    {r.evidence?.source ?? "Estimate provider"} forecast data.
                  </p>
                )}
                <div className={styles.cases}>
                  {forecast.cases.map((c) => (
                    <article key={c.name}>
                      <span>
                        {c.name === "Bear"
                          ? "Lower"
                          : c.name === "Bull"
                            ? "Higher"
                            : "Central"}{" "}
                        assumption
                      </span>
                      <strong>{amount(c.target, forecast.currency)}</strong>
                      <b>{percent(c.change, true)} vs reference</b>
                      <small>
                        {c.eps != null
                          ? `EPS ${amount(c.eps, forecast.currency)} × ${c.multiple.toFixed(1)}× P/E`
                          : `Revenue ${amount(c.revenue, forecast.currency, true)} × ${c.multiple.toFixed(1)}× EV/revenue`}
                      </small>
                      {c.dilution != null && (
                        <small>
                          {percent(c.dilution * 100)} assumed share dilution
                        </small>
                      )}
                      <small>
                        {percent(c.annual, true)} annualized over{" "}
                        {forecast.years.toFixed(1)} years
                      </small>
                    </article>
                  ))}
                </div>
                <p className={styles.note}>
                  Reported low/average/high forecasts use 0.8× / 1.0× / 1.2× the
                  reference multiple. Outcomes depend on these assumptions and
                  are not intrinsic fair values.
                  {forecast.basis === "revenue" &&
                    ` Revenue scenarios subtract net debt of ${amount(forecast.netDebt, forecast.currency, true)} (balance date ${dateLabel(forecast.balanceDate)}) and divide by diluted shares.`}{" "}
                  {forecast.caveat}
                </p>
              </>
            ) : (
              <p className={styles.empty}>{forecast.reason}</p>
            )}
          </>
        )}
        {active === 3 && (
          <>
            <div className={styles.subhead}>
              <h3>Historical price risk</h3>
              <span>Empirical price outcomes · not valuation</span>
            </div>
            <p className={styles.note}>
              These cases reuse past price movements. They do not substitute for
              missing analyst targets or AURYN earnings forecasts.
            </p>
            {model.risk.available ? (
              <PriceRiskCases scenarios={model.risk} />
            ) : (
              <p className={styles.empty}>{model.risk.reason}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
