"use client";
import { useMemo, type ReactNode } from "react";
import type { Research } from "@/lib/types";
import { researchBrief } from "@/lib/research-brief";
import { dateLabel, amount, percent } from "@/lib/format";
import PositionAwareResearch from "./PositionAwareResearch";
import CaseRange from "./CaseRange";
import AnalystTargets from "./AnalystTargets";
export default function DecisionOverview({
  research: r,
  onTab,
  pro = false,
  modeControl,
  chart,
}: {
  research: Research;
  pro?: boolean;
  modeControl?: ReactNode;
  chart?: ReactNode;
  onTab: (tab: "Thesis" | "Valuation" | "Technicals" | "News") => void;
}) {
  const b = useMemo(() => researchBrief(r), [r]);
  const next = r.evidence?.earnings
    ?.filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const cases = b.scenario
    ? [
        { name: "Bear", target: b.scenario.low },
        { name: "Base", target: b.scenario.base },
        { name: "Bull", target: b.scenario.high },
      ].map((c) => ({
        ...c,
        change:
          r.quote.price != null && r.quote.price > 0
            ? (c.target / r.quote.price - 1) * 100
            : 0,
      }))
    : [];
  const warning =
    b.conflicting || /risk|verification|evidence first/i.test(b.business.title);
  const multiplier = b.accumulation.multiplier;
  const crypto = r.company.assetType === "crypto";
  return (
    <section
      className="overview-visual"
      aria-label="Stock overview"
      data-depth={pro ? "pro" : "simple"}
    >
      <div className="overview-visual-layout">
        <div className="overview-primary">
          <header className="overview-visual-heading">
            <div>
              <span className="eyebrow">Business assessment</span>
              <h2>{b.business.title}</h2>
              <p>{b.business.reason}</p>
              {!crypto && (
                <div
                  className="overview-evidence-tags"
                  aria-label="Key business evidence"
                >
                  {b.businessNumbers.revenueGrowth != null && (
                    <span
                      data-tone={
                        b.businessNumbers.revenueGrowth >= 0
                          ? "positive"
                          : "risk"
                      }
                    >
                      {b.businessNumbers.revenueGrowth >= 0
                        ? "Revenue growing"
                        : "Revenue declining"}
                    </span>
                  )}
                  {b.businessNumbers.fcf != null && (
                    <span
                      data-tone={
                        b.businessNumbers.fcf >= 0 ? "positive" : "risk"
                      }
                    >
                      {b.businessNumbers.fcf >= 0
                        ? "Positive cash after capex"
                        : "Cash burn after capex"}
                    </span>
                  )}
                  {b.conflicting && (
                    <span data-tone="risk">Resolve conflicting inputs</span>
                  )}
                </div>
              )}
            </div>
            <div className="overview-mobile-depth">{modeControl}</div>
            <span
              className={`overview-evidence-status ${warning ? "caution" : ""}`}
            >
              {crypto
                ? "Crypto · price-based analysis"
                : b.conflicting
                  ? "Input conflict"
                  : b.period
                    ? `Financials · ${dateLabel(b.period)}`
                    : "Financial evidence incomplete"}
            </span>
          </header>

          <div className="overview-visual-chart research-canvas">
            <header>
              <h3>Price in context</h3>
              <span>History alongside the business case</span>
            </header>
            {chart}
          </div>
        </div>
        <aside
          className="overview-visual-rail"
          aria-label="Valuation and accumulation"
        >
          <section className="overview-visual-value">
            <header>
              <h3>
                {b.scenario && b.scenarioEligible
                  ? "Bear, base & bull"
                  : b.consensus
                    ? "Analyst expectations"
                    : "Valuation context"}
              </h3>
              <button
                className="text-button"
                onClick={() => onTab("Valuation")}
              >
                Value ↗
              </button>
            </header>
            {b.scenario && b.scenarioEligible ? (
              <>
                <CaseRange
                  cases={cases}
                  price={r.quote.price}
                  currency={b.scenario.currency}
                  referenceLabel={r.quote.stale ? "Older quote" : "Current"}
                />
                <small>
                  {b.scenario.calculatedMultiple
                    ? "Price-anchored sensitivity · calculated multiple · not fair value"
                    : `Earnings scenarios · ends ${dateLabel(b.scenario.end)} · not intrinsic value`}
                </small>
              </>
            ) : b.consensus ? (
              <AnalystTargets research={r} />
            ) : (
              <div className="overview-value-gap">
                <span>
                  {crypto
                    ? "Corporate valuation does not apply"
                    : "Fair value not established"}
                </span>
                <p>
                  {crypto
                    ? "Review network economics, liquidity and price risk instead."
                    : b.conflicting
                      ? "Share and listing inputs need reconciliation."
                      : "Operating and funding assumptions are needed."}
                </p>
                {!crypto && (
                  <details className="overview-scenario-reason">
                    <summary>What prevents the calculation?</summary>
                    <p>{b.value.reason}</p>
                  </details>
                )}
                <button
                  className="text-button"
                  onClick={() => onTab("Valuation")}
                >
                  Review valuation evidence ↗
                </button>
              </div>
            )}
          </section>
          <section className="overview-visual-accumulation">
            <header>
              <h3>Monthly Accumulation</h3>
              <button
                className="text-button"
                onClick={() => onTab("Technicals")}
              >
                Technicals ↗
              </button>
            </header>
            <div className="overview-multiplier">
              <strong>{multiplier == null ? "—" : `${multiplier}×`}</strong>
              <div>
                <b>
                  {multiplier == null
                    ? "More monthly history needed"
                    : multiplier === 0
                      ? "Pause condition"
                      : multiplier === 1
                        ? "Baseline contribution condition"
                        : "Increased contribution condition"}
                </b>
                <small>
                  {b.accumulation.month
                    ? `${b.accumulation.month} · confirmed`
                    : "No confirmed reading"}
                </small>
              </div>
            </div>
            <div
              className="overview-zone-scale"
              aria-label={
                multiplier == null
                  ? "No eligible accumulation reading"
                  : `Confirmed ${multiplier} times condition`
              }
            >
              {[0, 1, 2, 3, 4].map((v) => (
                <span key={v} data-active={v === multiplier} data-zone={v}>
                  {v}×
                </span>
              ))}
            </div>
            <div
              className="overview-dca-readings"
              aria-label="Confirmed and forming monthly conditions"
            >
              <div>
                <span>
                  Confirmed · {b.accumulation.month ?? "not established"}
                </span>
                <b>{multiplier == null ? "—" : `${multiplier}×`}</b>
              </div>
              <div>
                <span>
                  {b.accumulation.forming?.month ?? "Current month"} · forming
                </span>
                <b>
                  {b.accumulation.forming
                    ? `${b.accumulation.forming.multiplier}×`
                    : "—"}
                </b>
              </div>
            </div>
            <p>{b.accumulation.reason}</p>
            <small>
              Price-only experimental rule; not a buy or sell instruction.
            </small>
          </section>
        </aside>
      </div>
      <div className="overview-visual-facts" aria-label="Business at a glance">
        {crypto ? (
          <>
            <div>
              <span>50-day average</span>
              <strong className="blue">
                {amount(b.timing.ma50, r.quote.currency)}
              </strong>
              <small>Completed daily prices</small>
            </div>
            <div>
              <span>200-day average</span>
              <strong className="blue">
                {amount(b.timing.ma200, r.quote.currency)}
              </strong>
              <small>Long-term price reference</small>
            </div>
            <div>
              <span>RSI · 14</span>
              <strong>{b.timing.rsi?.toFixed(1) ?? "—"}</strong>
              <small>Momentum, not fair value</small>
            </div>
            <div>
              <span>Price structure</span>
              <strong>{b.timing.trend}</strong>
              <small>Continuous market · no corporate earnings</small>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>Revenue growth</span>
              <strong
                className={
                  b.businessNumbers.revenueGrowth != null &&
                  b.businessNumbers.revenueGrowth < 0
                    ? "negative"
                    : "blue"
                }
              >
                {b.businessNumbers.revenueGrowth == null
                  ? "—"
                  : percent(b.businessNumbers.revenueGrowth)}
              </strong>
              <small>Comparable year over year</small>
            </div>
            <div>
              <span>Operating margin</span>
              <strong
                className={
                  b.businessNumbers.operatingMargin != null &&
                  b.businessNumbers.operatingMargin < 0
                    ? "negative"
                    : "positive"
                }
              >
                {b.businessNumbers.operatingMargin == null
                  ? "—"
                  : percent(b.businessNumbers.operatingMargin)}
              </strong>
              <small>Reported operating profitability</small>
            </div>
            <div>
              <span>Cash after capex</span>
              <strong
                className={
                  b.businessNumbers.fcf != null && b.businessNumbers.fcf < 0
                    ? "negative"
                    : "positive"
                }
              >
                {amount(
                  b.businessNumbers.fcf,
                  b.businessNumbers.currency,
                  true,
                )}
              </strong>
              <small>Operating cash flow less capex</small>
            </div>
            <div>
              <span>Next report</span>
              <strong className="blue">
                {next
                  ? dateLabel(next.date).replace(/, \d{4}$/, "")
                  : "Not supplied"}
              </strong>
              <small>
                {next
                  ? "Scheduled earnings · date may change"
                  : "Check company announcements"}
              </small>
            </div>
          </>
        )}
      </div>
      {!crypto && b.trajectory.length >= 2 && (
        <section
          className="overview-trajectory"
          aria-label="Reported annual financial trends"
        >
          <header>
            <h3>Business in motion</h3>
            <span>Reported annual periods · {b.businessNumbers.currency}</span>
          </header>
          <div className="overview-trend-grid">
            {(
              [
                { key: "revenue", label: "Revenue" },
                { key: "fcf", label: "Cash after capex" },
                { key: "shares", label: "Weighted shares" },
              ] as const
            ).map(({ key, label }) => {
              const rows = b.trajectory.filter(
                (row) => row[key] != null && Number.isFinite(row[key]),
              );
              if (rows.length < 2) return null;
              const scale = Math.max(
                ...rows.map((row) => Math.abs(row[key]!)),
                1,
              );
              const signed = rows.some((row) => row[key]! < 0);
              return (
                <figure key={key}>
                  <figcaption>{label}</figcaption>
                  <div
                    className="overview-trend-bars"
                    role="img"
                    aria-label={`${label}: ${rows.map((row) => `${row.end}: ${row[key]}`).join("; ")}`}
                  >
                    {rows.map((row) => (
                      <div key={row.end} className="overview-trend-column">
                        <span className={row[key]! < 0 ? "negative" : ""}>
                          {key === "shares"
                            ? row[key]!.toLocaleString("en-US", {
                                notation: "compact",
                                maximumFractionDigits: 1,
                              })
                            : amount(row[key], row.currency, true)}
                        </span>
                        <div
                          className="overview-trend-track"
                          data-signed={signed}
                        >
                          <i
                            data-negative={row[key]! < 0}
                            data-shares={key === "shares"}
                            style={{
                              height: `${Math.max(1, (Math.abs(row[key]!) / scale) * (signed ? 48 : 96))}%`,
                            }}
                          />
                        </div>
                        <small>{row.end.slice(0, 7)}</small>
                      </div>
                    ))}
                  </div>
                  <details>
                    <summary>Read values</summary>
                    <ul>
                      {rows.map((row) => (
                        <li key={row.end}>
                          {row.end}:{" "}
                          {key === "shares"
                            ? row[key]!.toLocaleString("en-US")
                            : amount(row[key], row.currency)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </figure>
              );
            })}
          </div>
        </section>
      )}
      <div className={`overview-visual-risk ${warning ? "caution" : ""}`}>
        <b>Main risk</b>
        <span>
          {b.conflicting
            ? "Valuation inputs conflict; scenario estimates are withheld."
            : b.risk}
        </span>
        <button className="text-button" onClick={() => onTab("Thesis")}>
          View the case ↗
        </button>
      </div>
      {b.counterCase.length > 0 && (
        <div className="overview-countercase">
          <b>What would change this view?</b>
          <span>{b.counterCase[0]}</span>
        </div>
      )}
      {pro && !crypto && (
        <section
          className="overview-pro-signals"
          aria-label="Completed-price studies"
        >
          <h3>Completed-price studies</h3>
          <div>
            <span>
              50-day average <b>{amount(b.timing.ma50, r.quote.currency)}</b>
            </span>
            <span>
              200-day average <b>{amount(b.timing.ma200, r.quote.currency)}</b>
            </span>
            <span>
              RSI · 14 <b>{b.timing.rsi?.toFixed(1) ?? "—"}</b>
            </span>
            <span>
              Trend <b>{b.timing.trend}</b>
            </span>
          </div>
          <small>
            Historical price evidence, separate from business quality and
            valuation.
          </small>
        </section>
      )}
      <PositionAwareResearch research={r} compact />
      <details className="overview-data-details">
        <summary>Calculation basis & data status</summary>
        <dl>
          {b.checks.map((x) => (
            <div key={x.label}>
              <dt>{x.label}</dt>
              <dd>
                {x.label === "Price observation" && x.status === "available"
                  ? dateLabel(x.detail)
                  : x.detail}
              </dd>
            </div>
          ))}
        </dl>
        <small>
          Consistency checks are not an independent audit. Analyst targets and
          conditional model scenarios are different measures.
        </small>
      </details>
    </section>
  );
}
