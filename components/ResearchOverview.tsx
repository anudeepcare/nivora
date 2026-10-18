"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { perspective, latestFinancialEvidence } from "@/lib/analysis";
import { financialCase, valuationScale } from "@/lib/research-summary";
import { researchOutlook, consensusOutlook } from "@/lib/outlook";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help, DataStamp } from "./Ui";

export function ResearchOutlook({
  research: r,
  detailed = false,
}: {
  research: Research;
  detailed?: boolean;
}) {
  const outlook = useMemo(() => researchOutlook(r), [r]);
  const consensus = useMemo(() => consensusOutlook(r), [r]);
  const target = consensus?.target;
  if (detailed) {
    const scale =
      outlook.available && r.quote.price != null
        ? valuationScale(
            outlook.cases.map((c) => c.target),
            r.quote.price,
          )
        : null;
    const multiple = (v: number | null | undefined) =>
      v == null ? "—" : v <= 0 ? "N/M" : `${v.toFixed(1)}×`;
    return (
      <section className="value-picture">
        <header className="section-head">
          <div>
            <h2>Value the business. Understand the range.</h2>
            <p>Forecast sensitivities are separate from reported facts.</p>
          </div>
          <Help label="Model details" trigger="Model details">
            {outlook.available ? (
              <>
                <p>
                  Annual EPS forecasts for {dateLabel(outlook.end)}:{" "}
                  {outlook.cases
                    .map((c) => `${c.name} ${amount(c.eps, outlook.currency)}`)
                    .join(" · ")}
                  .
                </p>
                <p>
                  Exit P/E assumptions:{" "}
                  {outlook.cases
                    .map((c) => `${c.name} ${c.multiple.toFixed(1)}×`)
                    .join(" · ")}
                  . These are 80%, 100% and 120% of reported forward P/E, not
                  verified future multiples.
                </p>
                <p>
                  Forecast sensitivity, not intrinsic fair value. Observation:{" "}
                  {dateLabel(outlook.asOf)}.
                </p>
              </>
            ) : (
              <p>
                {outlook.reason} No substitute target is used as a bear, base or
                bull case.
              </p>
            )}
          </Help>
        </header>
        <div className="grid2">
          <div>
            <ResearchOutlook research={r} />
            {scale && (
              <div className="price-scale">
                <div className="scale-track" />
                <div
                  className="scale-marker"
                  style={{ left: `${scale.quotePosition}%` }}
                >
                  <span>Today {amount(r.quote.price, r.quote.currency)}</span>
                </div>
                <div className="scale-labels">
                  <span>{amount(scale.min, r.quote.currency)}</span>
                  <span>{amount(scale.max, r.quote.currency)}</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <h3>How to read the cases</h3>
            {outlook.available ? (
              outlook.cases.map((c) => (
                <div className="driver" key={c.name}>
                  <div className="row between">
                    <h3>{c.name}</h3>
                    <span className="num small">
                      {percent(c.annual, true)} / year
                    </span>
                  </div>
                  <p>
                    {c.name === "Bear"
                      ? "Lower forecast earnings with a lower valuation multiple."
                      : c.name === "Bull"
                        ? "Higher forecast earnings with a higher valuation multiple."
                        : "Average forecast earnings with the current forward multiple."}
                  </p>
                </div>
              ))
            ) : (
              <div className="case-unavailable">
                {["Bear", "Base", "Bull"].map((name) => (
                  <div className="driver" key={name}>
                    <h3>{name}</h3>
                    <p>Comparable forecast inputs are not available yet.</p>
                  </div>
                ))}
              </div>
            )}
            <p className="context-note">
              Annualised price change over the stated forecast horizon.
              Dividends, fees and taxes are excluded. No probabilities are
              assigned.
            </p>
          </div>
        </div>
        <header className="section-head">
          <div>
            <h2>Market context</h2>
            <p>These ratios are separate from model outputs.</p>
          </div>
        </header>
        <div className="grid3">
          {[
            ["P/E · TTM", multiple(r.evidence?.multiples?.TrailingPE)],
            ["Forward P/E", multiple(r.evidence?.multiples?.ForwardPE)],
            [
              "EV / revenue",
              multiple(r.evidence?.multiples?.EnterpriseValueRevenue),
            ],
          ].map(([label, value]) => (
            <div className="stat-pair" key={label}>
              <span>{label}</span>
              <strong className="num">{value}</strong>
            </div>
          ))}
        </div>
        <div className="shared-stamp">
          <DataStamp source={r.evidence?.source} asOf={r.evidence?.updatedAt} />
        </div>
      </section>
    );
  }
  return (
    <section
      className={`outlook ${detailed ? "outlook-detailed" : ""}`}
      aria-label="Research outlook"
    >
      <div className="row between">
        <h2>
          {outlook.available ? `${outlook.period} outlook` : "Company outlook"}
        </h2>
        <span className="pill">
          {outlook.available ? "Sensitivity" : "Evidence"}
        </span>
      </div>
      {outlook.available ? (
        <>
          <div className="scenario-list">
            {outlook.cases.map((c, i) => (
              <div className="outcome" key={c.name}>
                <div>
                  <div
                    className={`label ${i === 0 ? "negative" : i === 2 ? "positive" : ""}`}
                  >
                    <i />
                    {c.name}
                  </div>
                  <div className="sub">
                    {i === 0
                      ? "Lower EPS · lower multiple"
                      : i === 2
                        ? "Higher EPS · higher multiple"
                        : "Average EPS · current multiple"}
                  </div>
                </div>
                <div className="target">
                  <strong className="num">
                    {amount(c.target, outlook.currency)}
                  </strong>
                  <span className={c.change < 0 ? "negative" : "positive"}>
                    {percent(c.change, true)}
                  </span>
                  <div className="scenario-bar" aria-hidden="true">
                    <i
                      style={{
                        width: `${(c.target / outlook.cases[2].target) * 100}%`,
                        background: `var(--${i === 0 ? "red" : i === 2 ? "green" : "blue"})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Help label="Outlook assumptions" trigger="View assumptions →">
            <p>
              These are forecast sensitivities, not intrinsic fair values. Dated{" "}
              {dateLabel(outlook.asOf)}. Annual forecast for{" "}
              {dateLabel(outlook.end)}; {outlook.years.toFixed(1)} years from
              the research snapshot.
            </p>
            <p>
              Low, average and high provider EPS estimates are multiplied by{" "}
              {outlook.cases.map((c) => `${c.multiple.toFixed(1)}×`).join(", ")}{" "}
              respectively. The multiples are 80%, 100% and 120% of the reported{" "}
              {outlook.forwardPE.toFixed(1)}× forward P/E. That stress range is
              an explicit assumption, not a forecast that a market multiple will
              hold.
            </p>
            <p>
              Dividends, fees and taxes are excluded. Analyst estimates and
              multiples may use adjusted earnings. This is separate from AURYN’s
              action guide and is not used to authorize trades.
            </p>
          </Help>
          {detailed && (
            <div className="outlook-drivers">
              {outlook.cases.map((c) => (
                <div key={c.name}>
                  <h3>{c.name} inputs</h3>
                  <div className="stat-pair">
                    <span>Annual forecast EPS</span>
                    <strong>{amount(c.eps, outlook.currency)}</strong>
                  </div>
                  <div className="stat-pair">
                    <span>Exit P/E assumption</span>
                    <strong>{c.multiple.toFixed(1)}×</strong>
                  </div>
                  <div className="stat-pair">
                    <span>Annualised price change</span>
                    <strong>{percent(c.annual, true)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="context-note">
            Annual EPS forecasts · {outlook.analysts ?? "Unknown"} reporting
            analysts · {dateLabel(outlook.asOf)}
          </p>
        </>
      ) : (
        <>
          <div className="scenario-list">
            {(["Bear", "Base", "Bull"] as const).map((name, i) => (
              <div className="outcome" key={name}>
                <div>
                  <div
                    className={`label ${i === 0 ? "negative" : i === 2 ? "positive" : ""}`}
                  >
                    <i />
                    {name}
                  </div>
                  <div className="sub">
                    {i === 0
                      ? "Slower growth"
                      : i === 2
                        ? "Stronger execution"
                        : "Steady execution"}
                  </div>
                </div>
                <div className="target">
                  <strong className="num">—</strong>
                  <span className="muted small">Forecast needed</span>
                </div>
              </div>
            ))}
          </div>
          <p className="context-note">{outlook.reason}</p>
          {target != null && (
            <p className="context-note">
              Analyst consensus {amount(target, r.quote.currency)} ·{" "}
              {dateLabel(consensus?.asOf)}. Separate from scenarios.
            </p>
          )}
          <div className="why">
            <h3>Keep the key drivers in view</h3>
            <p>
              {r.company.assetType === "crypto"
                ? "Network use, liquidity, supply and portfolio exposure."
                : "Revenue growth, cash generation, dilution and the durability of demand."}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export function KeyFinancialMetrics({ research: r }: { research: Research }) {
  const p = useMemo(() => perspective(r), [r]);
  const metrics =
    r.company.assetType === "crypto"
      ? [
          {
            label: "50-day average",
            value: amount(p.tech.ma50, r.quote.currency),
            detail: "Completed daily closes",
          },
          {
            label: "200-day average",
            value: amount(p.tech.ma200, r.quote.currency),
            detail: "Long-term price reference",
          },
          {
            label: "RSI · 14",
            value: p.tech.rsi?.toFixed(1) ?? "—",
            detail: "Momentum, not fair value",
          },
          {
            label: "Price trend",
            value: p.tech.trend,
            detail: dateLabel(p.tech.last),
          },
        ]
      : [
          {
            label: "Revenue",
            tone: "blue",
            value: amount(p.last?.revenue, p.last?.currency, true),
            detail:
              p.growth == null
                ? `${p.periodBasis} · ${dateLabel(p.last?.end)}`
                : `${percent(p.growth, true)} year over year`,
          },
          {
            label: "Operating margin",
            tone:
              p.last?.margin != null
                ? p.last.margin >= 0
                  ? "green"
                  : "red"
                : "",
            value: percent(p.last?.margin),
            detail: `${p.periodBasis} · share of revenue`,
          },
          {
            label: "Cash after capex",
            tone:
              p.last?.fcf != null ? (p.last.fcf >= 0 ? "green" : "red") : "",
            value: amount(p.last?.fcf, p.last?.currency, true),
            detail: "Operating cash flow − capex",
          },
          {
            label: "Forward P/E",
            tone: "violet",
            value:
              r.evidence?.multiples?.ForwardPE != null &&
              r.evidence.multiples.ForwardPE > 0
                ? `${r.evidence.multiples.ForwardPE.toFixed(1)}×`
                : "—",
            detail: "Provider earnings estimate",
          },
        ];
  return (
    <section className="metric-strip" aria-label="Key metrics">
      {metrics.map((m) => (
        <div className="metric" key={m.label}>
          <Help label={m.label} trigger={m.label}>
            <p>
              {m.detail}.{" "}
              {r.company.assetType === "crypto"
                ? "These are price observations and do not establish intrinsic value."
                : `Financial period: ${p.periodBasis} to ${dateLabel(p.last?.end)}. Reporting currency: ${p.last?.currency ?? "unknown"}. Forward P/E is a separate provider estimate, not a reported financial result.`}
            </p>
          </Help>
          <div className={`metric-number num ${"tone" in m ? m.tone : ""}`}>
            {m.value}
          </div>
          <div className="metric-sub">{m.detail}</div>
        </div>
      ))}
    </section>
  );
}

export function CaseHighlights({ research: r }: { research: Research }) {
  const e = useMemo(() => latestFinancialEvidence(r), [r]);
  const c = useMemo(
    () => financialCase(e.latest, e.prior),
    [e.latest, e.prior],
  );
  if (r.company.assetType === "crypto") return null;
  return (
    <section className="case-columns">
      <div>
        <h3>Supports the case</h3>
        <div className="case-points">
          {c.positive.slice(0, 3).map((x) => (
            <span key={x.key}>{x.title}</span>
          ))}
          {!c.positive.length && (
            <span className="muted">
              No confirmed financial strength in this snapshot.
            </span>
          )}
        </div>
      </div>
      <div>
        <h3>Risks to track</h3>
        <div className="case-points">
          {c.risks.slice(0, 3).map((x) => (
            <span key={x.key}>{x.title}</span>
          ))}
          {!c.risks.length && (
            <span className="muted">
              Review competition, execution and dilution.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
