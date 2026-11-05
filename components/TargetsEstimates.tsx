"use client";
import { useId, useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { targetsEstimates } from "@/lib/targets-estimates";
import { amount, dateLabel, percent } from "@/lib/format";
import AnalystTargets from "./AnalystTargets";
import EstimateRevisions from "./EstimateRevisions";
import PriceRiskCases from "./PriceRiskCases";
import ValuationLab from "./ValuationLab";
import styles from "./TargetsEstimates.module.css";

const tabs = [
  "Analyst targets",
  "Annual estimates",
  "AURYN scenarios",
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
  const forecast = model.forecast;
  return (
    <section className={styles.root} aria-label="Targets and estimates">
      <header className={styles.header}>
        <div>
          <span className="eyebrow">Expectations & assumptions</span>
          <h2>Targets & Estimates</h2>
          <p>
            Published expectations, conditional AURYN models and historical
            price risk answer different questions.
          </p>
        </div>
        <div className={styles.quote}>
          <small>
            {r.quote.stale ? "Older reference quote" : "Reference quote"}
          </small>
          <strong>{amount(r.quote.price, r.quote.currency)}</strong>
          <small>
            {dateLabel(r.quote.asOf)} · {r.quote.currency}
          </small>
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
            <dl className={styles.metadata}>
              <div>
                <dt>Target contributors</dt>
                <dd>Not supplied</dd>
              </div>
              <div>
                <dt>Target horizon</dt>
                <dd>Not supplied</dd>
              </div>
              <div>
                <dt>Dataset updated</dt>
                <dd>{dateLabel(model.consensus?.asOf)}</dd>
              </div>
              <div>
                <dt>Currency</dt>
                <dd>{r.quote.currency}</dd>
              </div>
            </dl>
            <p className={styles.note}>
              Rating counts are not target-contributor coverage. Missing
              low/high targets stay unavailable. Dataset dates are not
              individual analyst publication dates.
            </p>
            <p className={styles.note}>
              Target share/split basis is not independently supplied; no split
              adjustment is inferred.
            </p>
          </>
        )}
        {active === 1 && (
          <>
            <div className={styles.subhead}>
              <h3>Annual EPS & revenue consensus</h3>
              <span>Dataset updated {dateLabel(model.asOf)}</span>
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
                          {row.period || "Annual forecast"}
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
            <p className={styles.note}>
              Ranges are provider-reported estimates. Analyst counts refer to
              EPS coverage; revenue contributor counts are not supplied. Fiscal
              periods may be awaiting results. EPS accounting and split basis
              are not independently verified.
            </p>
            <EstimateRevisions research={r} />
          </>
        )}
        {active === 2 && (
          <>
            <div className={styles.subhead}>
              <h3>AURYN forecast sensitivity</h3>
              <span>Conditional assumptions · not analyst price targets</span>
            </div>
            {forecast.available ? (
              <>
                <p>
                  {forecast.period} · ends {dateLabel(forecast.end)} · estimates
                  updated {dateLabel(forecast.asOf)} · {forecast.currency} ·{" "}
                  {forecast.analysts ?? "Unknown"} EPS analysts
                </p>
                <div className={styles.cases}>
                  {forecast.cases.map((c) => (
                    <article key={c.name}>
                      <span>{c.name} assumption</span>
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
            <details className={styles.lab}>
              <summary>Test cash-flow assumptions & reverse valuation</summary>
              <ValuationLab research={r} />
            </details>
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
