"use client";
import CaseRange from "./CaseRange";
import AnalystTargets from "./AnalystTargets";
import MetricProvenance from "./MetricProvenance";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { perspective, latestFinancialEvidence } from "@/lib/analysis";
import { financialCase } from "@/lib/research-summary";
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
  const supported = outlook.available && outlook.basis === "earnings";
  if (detailed) {
    const multiple = (v: number | null | undefined) =>
      v == null ? "—" : v <= 0 ? "N/M" : `${v.toFixed(1)}×`;
    return (
      <section className="value-picture compact-value">
        <ResearchOutlook research={r} />
        <header className="section-head">
          <h3>Market multiples</h3>
        </header>
        <div className="grid3 valuation-metrics">
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
        <h2>Valuation snapshot</h2>
      </div>
      {consensus && !supported && <AnalystTargets research={r} />}
      <div className="valuation-summary" hidden={!!consensus || supported}>
        <div>
          <span>Current price</span>
          <strong className="num">
            {amount(r.quote.price, r.quote.currency)}
          </strong>
        </div>
        <div>
          <span>Analyst consensus</span>
          <strong className="num">
            {target != null ? amount(target, r.quote.currency) : "—"}
          </strong>
        </div>
        <div>
          <span>Gap to consensus</span>
          <strong
            className={`num ${consensus == null ? "" : consensus.change != null && consensus.change < 0 ? "negative" : "positive"}`}
          >
            {consensus ? percent(consensus.change, true) : "—"}
          </strong>
        </div>
      </div>
      <p className="valuation-summary-note" hidden={supported}>
        {consensus
          ? `Dataset updated ${dateLabel(consensus.asOf)}. Analyst opinion, not intrinsic fair value. A target horizon is not supplied.`
          : "No current comparable analyst target is available. Fair value is not established."}
      </p>
      {outlook.available ? (
        <details className="forecast-sensitivity" open={supported}>
          <summary>
            {supported ? "Bear, base & bull · earnings scenarios" : "Exploratory forecast-multiple sensitivity · not fair value"}
          </summary>
          <p className="sensitivity-warning">
            Not intrinsic fair value. These mechanical cases use assumed
            valuation multiples; they are not validated price targets.
          </p>
          <p className="outlook-horizon">
            Forecast ends {dateLabel(outlook.end)} ·{" "}
            {Math.round(outlook.years * 12)} months ahead
          </p>
          {outlook.caveat && <p className="context-note">{outlook.caveat}</p>}
          <CaseRange
            cases={outlook.cases}
            price={r.quote.price}
            currency={outlook.currency}
            referenceLabel={r.quote.stale ? "Older quote" : "Current"}
          />
          {outlook.basis === "revenue" && (
            <p className="context-note">
              Revenue × EV/sales, less net debt, with dilution stresses. Not a
              funded capacity forecast.
            </p>
          )}
          <Help label="Outlook assumptions" trigger="View assumptions →">
            {outlook.basis === "revenue" ? (
              <>
                <p>
                  Revenue forecasts dated {dateLabel(outlook.asOf)}, ending{" "}
                  {dateLabel(outlook.end)}. Low/average/high revenue is
                  multiplied by{" "}
                  {outlook.cases
                    .map((c) => `${c.multiple.toFixed(1)}×`)
                    .join(", ")}{" "}
                  EV/revenue.
                </p>
                <p>
                  Current reported shares: {outlook.shares?.toLocaleString()}.
                  Additional dilution: 20% / 10% / 0%. Net debt{" "}
                  {amount(outlook.netDebt, outlook.currency, true)}, dated{" "}
                  {dateLabel(outlook.balanceDate)}, is held constant. Future
                  capex, financing, contract fulfilment and capacity utilisation
                  are not forecast by this sensitivity. These assumptions may
                  materially overstate or understate equity value.
                </p>
              </>
            ) : (
              <>
                <p>
                  These are forecast sensitivities, not intrinsic fair values.
                  Dated {dateLabel(outlook.asOf)}. Annual forecast for{" "}
                  {dateLabel(outlook.end)}; {outlook.years.toFixed(1)} years
                  from the research snapshot.
                </p>
                <p>
                  Low, average and high provider EPS estimates are multiplied by{" "}
                  {outlook.cases
                    .map((c) => `${c.multiple.toFixed(1)}×`)
                    .join(", ")}{" "}
                  respectively. The multiples are 80%, 100% and 120% of the
                  reported {outlook.forwardPE.toFixed(1)}× forward P/E. That
                  stress range is an explicit assumption, not a forecast that a
                  market multiple will hold.
                </p>
                <p>
                  Dividends, fees and taxes are excluded. Analyst estimates and
                  multiples may use adjusted earnings. This is separate from
                  AURYN’s action guide and is not used to authorize trades.
                </p>
              </>
            )}
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
            Annual {outlook.basis === "revenue" ? "revenue" : "EPS"} forecasts ·{" "}
            {outlook.analysts ?? "Unknown"} reporting analysts ·{" "}
            {dateLabel(outlook.asOf)}
          </p>
        </details>
      ) : (
        <p className="model-coverage-note">{outlook.reason}</p>
      )}
    </section>
  );
}

export function KeyFinancialMetrics({
  research: r,
  omitRepeated = false,
}: {
  research: Research;
  omitRepeated?: boolean;
}) {
  const p = useMemo(() => perspective(r), [r]);
  const metrics: {
    label: string;
    value: string;
    detail: string;
    tone?: string;
  }[] =
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
            detail: "Forward earnings estimate",
          },
        ];
  return (
    <section
      className={`metric-band ${omitRepeated && r.company.assetType !== "crypto" ? "overview-additional-metrics" : ""}`}
      aria-label="Key metrics"
    >
      {metrics
        .filter(
          (m) =>
            !omitRepeated ||
            r.company.assetType === "crypto" ||
            !["Operating margin", "Cash after capex"].includes(m.label),
        )
        .map((m) => (
          <div className="metric" data-tone={m.tone ?? "neutral"} key={m.label}>
            <Help label={m.label} trigger={m.label}>
              <p>
                {m.detail}.{" "}
                {r.company.assetType === "crypto"
                  ? "These are price observations and do not establish intrinsic value."
                  : `Financial period: ${p.periodBasis} to ${dateLabel(p.last?.end)}. Reporting currency: ${p.last?.currency ?? "unknown"}. Forward P/E is a separate provider estimate, not a reported financial result.`}
              </p>
            </Help>
            <div className="metric-number num">{m.value}</div>
            {r.company.assetType === "stock" && (
              <MetricProvenance
                research={r}
                metrics={
                  m.label === "Revenue"
                    ? ["revenue"]
                    : m.label === "Operating margin"
                      ? ["operatingIncome", "revenue"]
                      : m.label === "Cash after capex"
                        ? ["operatingCashFlow", "capex"]
                        : []
                }
                calculated={m.label !== "Revenue" || p.periodBasis === "TTM"}
                estimated={m.label === "Forward P/E"}
              />
            )}

            <div
              className={`metric-sub ${m.label === "Revenue" && p.growth != null ? (p.growth >= 0 ? "positive" : "negative") : ""}`}
            >
              {m.detail}
            </div>
            {m.label === "Operating margin" &&
              p.last?.margin != null &&
              p.last.margin >= 0 && (
                <div
                  className="metric-meter"
                  aria-label={`Operating margin ${percent(p.last.margin)}`}
                >
                  <i
                    style={{
                      width: `${Math.max(0, Math.min(100, p.last.margin))}%`,
                    }}
                  />
                </div>
              )}
            {m.label === "Cash after capex" &&
              p.last?.fcf != null &&
              p.last?.revenue != null &&
              p.last.revenue > 0 && (
                <>
                  <div className="metric-sub">
                    {percent((p.last.fcf / p.last.revenue) * 100)} of revenue
                  </div>
                  {p.last.fcf >= 0 && (
                    <div className="metric-meter" aria-hidden="true">
                      <i
                        style={{
                          width: `${Math.max(0, Math.min(100, (p.last.fcf / p.last.revenue) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </>
              )}
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
      <div data-tone="supports">
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
      <div data-tone="risks">
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
