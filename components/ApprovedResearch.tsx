"use client";
import PriceRiskCases from "./PriceRiskCases";
import PaceReadings from "./PaceReadings";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Activity,
} from "lucide-react";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import type { Research } from "@/lib/types";
import {
  approvedResearch,
  type EvidenceSection,
} from "@/lib/approved-research";
import type { OverviewMetric } from "@/lib/overview-evidence";
import { amount, percent, dateLabel } from "@/lib/format";
import { useProduct } from "./Session";
import { Help } from "./Ui";
import MovementContext from "./MovementContext";
import ResearchChanges from "./ResearchChanges";
import PaceHelp from "./PaceHelp";
import { paceCode } from "@/lib/pace-presentation";

type Props = {
  research: Research;
  onTab: (tab: EvidenceSection) => void;
  chart?: ReactNode;
  pro?: boolean;
};
function metricValue(m: OverviewMetric) {
  return m.unit === "money"
    ? amount(m.value, m.currency, true)
    : m.unit === "percent"
      ? percent(m.value)
      : m.unit === "ratio"
        ? `${m.value.toFixed(2)}×`
        : m.value.toFixed(1);
}
const deeper: [EvidenceSection, string, string][] = [
  ["Financials", "Business", "Growth, margins & cash"],
  ["Valuation", "Value", "Assumptions & scenarios"],
  ["Technicals", "Price & Pace", "Chart, trend & accumulation"],
  ["News", "Catalysts", "News & earnings"],
  ["Analysts", "Analysts", "Forecasts & expectations"],
  ["Options", "Options", "Expiry, liquidity & risk"],
  ["Thesis", "Ownership", "Business case & holders"],
  ["Advanced", "More research", "Funding, peers & studies"],
];
export default function ApprovedResearch({ research: r, onTab, chart }: Props) {
  const { workspace, demo } = useProduct();
  const owns = !!workspace?.positions.some(
    (p) => sameProviderSymbol(p.symbol, r.company.symbol) && p.quantity > 0,
  );
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "hidden") setClock(Date.now());
    };
    tick();
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    window.addEventListener("pageshow", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      window.removeEventListener("pageshow", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  const now = demo ? Date.parse(r.retrievedAt) : clock;
  const m = useMemo(() => approvedResearch(r, owns, now), [r, owns, now]);
  const { decision: d, edge, evidence } = m,
    b = edge.brief,
    v = d.valuation;
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const leading = m.metrics
    .filter((x) =>
      [
        "revenue",
        "operatingMargin",
        "fcf",
        "cash",
        "roe",
        "operatingRunway",
      ].includes(x.key),
    )
    .slice(0, 4);
  const groups = [
    ["Business", evidence.business],
    ["Valuation", evidence.valuation],
    ["Price & trend", evidence.technical],
    ["Ownership", evidence.ownership],
  ] as const;
  const pace = edge.pacePresentation;
  return (
    <div className="approved-research decision-experience">
      <section
        className={`decision-focus decision-tone-${d.tone}`}
        aria-labelledby="auryn-decision-title"
      >
        <div className="decision-main">
          <div className="decision-kicker">
            <span>
              <Sparkles size={15} /> THE AURYN VIEW
            </span>
            <span>{d.horizon}</span>
          </div>
          <div className="decision-action-line">
            <h2 id="auryn-decision-title">{d.action}</h2>
            <span className="decision-confidence">
              <ShieldCheck size={14} />
              {d.confidence}
            </span>
          </div>
          <p className="decision-headline">{d.headline}</p>
          <ul className="decision-reasons">
            {d.reasons.slice(0, 3).map((reason) => (
              <li key={reason}>
                <span aria-hidden="true" /> {reason}
              </li>
            ))}
          </ul>
          {d.risks.length > 0 && (
            <p className="decision-main-risk">
              <ShieldCheck size={16} />
              <span>{d.risks[0]}</span>
            </p>
          )}
          <div className="decision-actions">
            <Link
              className="btn primary"
              href={`${prefix}/alerts?symbol=${encodeURIComponent(r.company.symbol)}`}
            >
              <Bell size={15} /> Set an alert
            </Link>
            <button className="text-link" onClick={() => onTab("Valuation")}>
              See the price case <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <section
          className={`pace-feature pace-state-${pace.status}`}
          aria-label="AURYN Pace"
        >
          <div className="pace-brand">
            <Activity size={17} /> AURYN PACE <PaceHelp />
          </div>
          <span className="pace-description">{pace.label}</span>
          <PaceReadings readings={edge.pacePeriods} />
          <p className="pace-context">{pace.detail}</p>
          <button
            className="text-link pace-open"
            onClick={() => onTab("Technicals")}
          >
            Calculation & history <ArrowUpRight size={15} />
          </button>
        </section>
      </section>
      <MovementContext research={r} onNews={() => onTab("News")} />
      <div className="research-market-grid">
        <section className="decision-chart card">
          <div className="section-head">
            <div>
              <span className="eyebrow">THE MARKET PICTURE</span>
              <h2>Price, with context.</h2>
            </div>
            <button className="text-link" onClick={() => onTab("Technicals")}>
              Open Price & Pace <ArrowUpRight size={16} />
            </button>
          </div>
          {chart ?? (
            <button className="btn" onClick={() => onTab("Technicals")}>
              Explore price history <ArrowRight size={16} />
            </button>
          )}
        </section>
        {v && (
          <section className="card decision-value">
            <div className="section-head">
              <div>
                <span className="eyebrow">PRICE IN PERSPECTIVE</span>
                <h2>
                  {v.basis === "cash-flow"
                    ? "What the cash-flow assumptions imply."
                    : "A range of earnings outcomes."}
                </h2>
                <p>
                  {v.basis === "cash-flow"
                    ? "Present-value sensitivities, not future price targets."
                    : `${v.years!.toFixed(1)}-year sensitivity · to ${dateLabel(v.end)}`}
                </p>
              </div>
              <button className="text-link" onClick={() => onTab("Valuation")}>
                Explore assumptions <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="decision-value-grid">
              {(["Bear", "Base", "Bull"] as const).map((label, i) => {
                const target = [v.bear, v.base, v.bull][i],
                  change = d.reference
                    ? (target / d.reference.price - 1) * 100
                    : null;
                return (
                  <div
                    key={label}
                    className={`decision-value-case case-${label.toLowerCase()}`}
                  >
                    <span>
                      {label} {v.basis === "cash-flow" ? "value" : "case"}
                    </span>
                    <strong>{amount(target, r.quote.currency)}</strong>
                    <small>
                      {percent(change, true)} vs{" "}
                      {amount(d.reference?.price, r.quote.currency)}
                    </small>
                  </div>
                );
              })}
            </div>
            <details className="decision-method">
              <summary>
                How this is calculated <ChevronDown size={15} />
              </summary>
              <p>{v.assumptions}</p>
              <p>
                Reference: {amount(d.reference?.price, r.quote.currency)} ·{" "}
                {dateLabel(d.reference?.asOf)} ·{" "}
                {d.reference?.basis === "settled-close"
                  ? "completed daily close"
                  : "dated quote"}
                . Scenario outcomes are not probabilities.
              </p>
            </details>
          </section>
        )}
        {!v && b.priceRisk.available && (
          <section className="card decision-price-risk">
            <div className="section-head">
              <div>
                <span className="eyebrow">PRICE SCENARIOS</span>
                <h2>A range of price outcomes.</h2>
                <p>
                  Based on historical volatility. Separate from AURYN valuation
                  and analyst targets.
                </p>
              </div>
            </div>
            <PriceRiskCases scenarios={b.priceRisk} compact />
            <button className="text-link" onClick={() => onTab("Valuation")}>
              Build a valuation case <ArrowUpRight size={15} />
            </button>
          </section>
        )}
      </div>
      <nav
        className="research-shortcuts"
        aria-label="Company research sections"
      >
        {deeper.slice(0, 4).map(([key, title]) => (
          <button key={key} onClick={() => onTab(key)}>
            {title}
            <ArrowUpRight size={15} />
          </button>
        ))}
      </nav>
      <ResearchChanges research={r} />
      <div className="decision-detail-grid">
        <section className="card decision-checkpoint">
          <span className="eyebrow">WHAT CHANGES THE VIEW</span>
          <h3>A clear next checkpoint.</h3>
          <p>{d.changeConditions[0]}</p>
          {d.changeConditions.length > 1 && (
            <details>
              <summary>
                Other conditions <ChevronDown size={14} />
              </summary>
              <ul>
                {d.changeConditions.slice(1).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
          )}
          <button className="text-link" onClick={() => onTab("News")}>
            Follow company updates <ArrowUpRight size={15} />
          </button>
        </section>
        <section className="card decision-at-glance">
          <div className="section-head">
            <div>
              <span className="eyebrow">THE OPERATING PICTURE</span>
              <h3>
                {d.business === "strong"
                  ? "Healthy operating evidence"
                  : d.business === "weak"
                    ? "Operating pressure"
                    : "The latest reported results"}
              </h3>
            </div>
            <button
              className="icon-button"
              onClick={() => onTab("Financials")}
              aria-label="Open financial statements"
            >
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="decision-key-metrics">
            {leading.map((metric) => (
              <div key={metric.key}>
                <span>
                  {metric.label}
                  <Help label={metric.label}>{metric.help}</Help>
                </span>
                <strong
                  className={
                    metric.tone === "risk"
                      ? "red"
                      : metric.tone === "positive"
                        ? "green"
                        : ""
                  }
                >
                  {metricValue(metric)}
                </strong>
              </div>
            ))}
          </div>
          {!leading.length && (
            <p>
              {r.company.assetType === "crypto"
                ? "Corporate financial statements do not apply to this asset. Price history and accumulation remain available."
                : "Open the company reports and dated price history while the financial sources refresh."}
            </p>
          )}
          {d.period && (
            <small>
              Reporting period · {dateLabel(d.period)} · {evidence.currency}
            </small>
          )}
        </section>
      </div>
      <section className="card decision-metrics">
        <div className="section-head">
          <div>
            <span className="eyebrow">EVERY NUMBER HAS A SOURCE</span>
            <h2>The details behind the decision.</h2>
            <p>Relevant metrics, with definitions and reporting context.</p>
          </div>
        </div>
        {groups
          .filter(([, rows]) => rows.length)
          .map(([title, rows]) => (
            <details
              key={title}
              className="metric-disclosure"
              open={title === "Business"}
            >
              <summary>
                <span>{title}</span>
                <span>
                  {rows.length} metrics <ChevronDown size={16} />
                </span>
              </summary>
              <div className="decision-metric-grid">
                {rows.map((metric) => (
                  <div key={metric.key}>
                    <span>
                      {metric.label}
                      <Help label={metric.label}>{metric.help}</Help>
                    </span>
                    <strong
                      className={
                        metric.tone === "risk"
                          ? "red"
                          : metric.tone === "positive"
                            ? "green"
                            : ""
                      }
                    >
                      {metricValue(metric)}
                    </strong>
                  </div>
                ))}
              </div>
            </details>
          ))}
        <details className="decision-method">
          <summary>
            Decision rules & source context <ChevronDown size={15} />
          </summary>
          <p>{d.method}</p>
          <p>
            Buy/Add requires supported operating strength and an attractive
            model price, without the listed funding risks or RSI of 75 or
            higher. A cash-flow entry uses a 20% cushion to the base value. An
            earnings entry uses at least 12% annualized base upside and a bear
            decline no worse than 35%. These screening thresholds are not a
            validated forecast of investment performance.
          </p>
          <p>
            Hold requires an existing position, supported operations and an
            available price model. Reduce/Avoid flags operating funding pressure
            or sustained deterioration. Sell requires negative equity, debt and
            less than six months of operating runway together. Reported cash
            runway excludes unreported financing and future changes in spending.
          </p>
          {d.risks.map((risk) => (
            <p key={risk}>{risk}</p>
          ))}
          <p>
            Financial period: {dateLabel(d.period)}. Price:{" "}
            {dateLabel(d.reference?.asOf)}.{" "}
            {demo
              ? "Illustrative preview observations."
              : "Source observations may have different update schedules."}
          </p>
        </details>
      </section>
      <section
        className="research-tool-links"
        aria-label="Additional company research"
      >
        {deeper.slice(4).map(([key, title, description]) => (
          <button key={key} onClick={() => onTab(key)}>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </section>
    </div>
  );
}
