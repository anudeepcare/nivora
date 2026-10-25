"use client";
import { useMemo, type ReactNode } from "react";
import type { Research } from "@/lib/types";
import { researchEdge } from "@/lib/edge-research";
import { amount, percent, dateLabel } from "@/lib/format";
import { latestFinancialEvidence } from "@/lib/analysis";
import { Help } from "./Ui";
import CaseRange from "./CaseRange";
import AnalystTargets from "./AnalystTargets";
import PriceRiskCases from "./PriceRiskCases";
import { useProduct } from "./Session";

type Tab = "Thesis" | "Valuation" | "Technicals" | "News";
export default function EdgeOverview({
  research: r,
  onTab,
  chart,
  modeControl,
  pro = false,
}: {
  research: Research;
  onTab: (tab: Tab) => void;
  chart?: ReactNode;
  modeControl?: ReactNode;
  pro?: boolean;
}) {
  const { workspace } = useProduct();
  const ownsPosition = !!workspace?.positions.some(
    (p) => p.symbol === r.company.symbol && p.quantity > 0,
  );
  const edge = useMemo(() => researchEdge(r, ownsPosition), [r, ownsPosition]),
    b = edge.brief;
  const p = latestFinancialEvidence(r).latest;
  const financialSpecialist = [
    "financial",
    "insurance",
    "specialized-financial",
    "real-estate",
  ].includes(b.coverage.family);
  const cashConversion =
    !financialSpecialist &&
    p?.netIncome != null &&
    p.netIncome > 0 &&
    p.fcf != null
      ? (p.fcf / p.netIncome) * 100
      : null;
  const fcfMargin =
    !financialSpecialist && p?.revenue != null && p.revenue > 0 && p.fcf != null
      ? (p.fcf / p.revenue) * 100
      : null;
  const next = r.evidence?.earnings
    ?.filter((e) => e.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const readings = [
    {
      name: "Staying Power",
      value: edge.businessLabel,
      tone:
        edge.business === "strong"
          ? "positive"
          : edge.business === "weak"
            ? "risk"
            : "caution",
      detail:
        fcfMargin != null
          ? `${percent(fcfMargin)} FCF margin`
          : financialSpecialist
            ? b.coverage.family
            : "Comparable cash-flow evidence needed",
      help: "Operating durability is assessed from available cash generation, profitability and growth. This is not a verified moat assessment.",
    },
    {
      name: "Price Advantage",
      value: edge.valueLabel,
      tone: edge.value === "supported" ? "positive" : "caution",
      detail: "Scenario-dependent · not intrinsic value",
      help: "A conditional cushion requires a reconciled earnings scenario with at least 15% base upside and no more than 40% bear downside. All-positive cases or base upside over 100% require review rather than earning a favorable label. These policy thresholds are experimental, not backtested optimal levels.",
    },
    {
      name: "Entry Conditions",
      value: edge.timingLabel,
      tone:
        edge.timing === "favorable"
          ? "positive"
          : edge.timing === "extended"
            ? "risk"
            : "caution",
      detail:
        b.timing.rsi != null
          ? `RSI ${b.timing.rsi.toFixed(0)} · ${b.timing.trend}`
          : "More price history needed",
      help: "Trend compares settled closes with 50-day and 200-day moving averages. RSI at 75 or above marks extension. Timing does not establish business value.",
    },
  ];
  const cases =
    b.scenario && b.scenarioEligible
      ? ["Bear", "Base", "Bull"].map((name, i) => {
          const target = [b.scenario!.low, b.scenario!.base, b.scenario!.high][
            i
          ];
          return {
            name,
            target,
            change:
              r.quote.price != null && r.quote.price > 0
                ? (target / r.quote.price - 1) * 100
                : 0,
          };
        })
      : [];
  return (
    <section className="edge-overview" aria-label="Stock overview">
      <div className="edge-top">
        <section className="edge-verdict" data-tone={edge.tone}>
          <header>
            <span className="edge-eyebrow">AURYN EDGE</span>
            <div>{modeControl}</div>
          </header>
          <h2>{edge.verdict}</h2>
          <p>{edge.reason}</p>
          {edge.referenceBasis === "settled-close" && (
            <small>
              Research uses the dated settled close shown above, not a live
              execution price.
            </small>
          )}
          <div className="edge-readings">
            {readings.map((x) => (
              <div key={x.name} data-tone={x.tone}>
                <Help label={x.name} trigger={x.name}>
                  {x.help}
                </Help>
                <strong>{x.value}</strong>
                <span className="edge-reading-bar" aria-hidden="true" />
                <small>{x.detail}</small>
              </div>
            ))}
          </div>
          <details className="edge-method" open={pro}>
            <summary>How this reading is reached</summary>
            <p>
              Edge combines business evidence, conditional valuation, entry
              conditions and explicit risk gates. It is not a personalized trade
              instruction. Portfolio size and circumstances still matter.
            </p>
            <p>
              Evidence confidence: {edge.confidence}. Policy {edge.version}; not
              independently validated for investment performance. A missing
              valuation never counts as cheap.
            </p>
          </details>
        </section>
        <section className="edge-pace">
          <span className="edge-eyebrow">AURYN PACE</span>
          <h3>
            {edge.pace == null
              ? "Not assessed"
              : edge.pace === 0
                ? "0× · Paused"
                : `${edge.pace}× · ${["", "Steady", "Elevated", "Strong", "Exceptional"][edge.pace]}`}
          </h3>
          <p>
            Confirmed monthly reading
            {b.accumulation.month ? ` · ${b.accumulation.month}` : ""}
          </p>
          {b.accumulation.forming && (
            <div className="edge-provisional">
              Forming: {b.accumulation.forming.multiplier}× · provisional
            </div>
          )}
          {edge.pace !== edge.pricePace && (
            <p>
              Price zone {edge.pricePace}×; additions paused by the evidence
              risk check.
            </p>
          )}
          <Help label="AURYN Pace" trigger="How to read Pace">
            <p>
              1× is your usual scheduled contribution; 2×–4× are multiples of
              it, not leverage or predicted returns. 0× pauses additions and
              does not mean sell. The forming month can change.
            </p>
            <p>{b.accumulation.reason}</p>
          </Help>
          <button className="text-button" onClick={() => onTab("Technicals")}>
            View price evidence →
          </button>
        </section>
      </div>
      {edge.disconnect && (
        <section className="edge-disconnect">
          <span className="edge-eyebrow">THE DISCONNECT</span>
          <h3>{edge.disconnect.title}</h3>
          <p>{edge.disconnect.text}</p>
        </section>
      )}
      <div className="edge-market">
        <section className="edge-chart research-canvas">
          <header>
            <h3>Price in context</h3>
            <span>Price history has its own observation date</span>
          </header>
          {chart}
        </section>
        <section className="edge-scenarios">
          <header>
            <h3>AURYN scenarios</h3>
            <button className="text-button" onClick={() => onTab("Valuation")}>
              Assumptions →
            </button>
          </header>
          {cases.length ? (
            <>
              <CaseRange
                cases={cases}
                price={r.quote.price}
                currency={b.scenario!.currency}
              />
              <p className="edge-caption">
                Earnings sensitivity · ends {dateLabel(b.scenario!.end)}. Not
                intrinsic value.
              </p>
              {edge.value === "unestablished" && (
                <p className="edge-caption">
                  These assumptions do not establish a dependable entry cushion.
                </p>
              )}
            </>
          ) : b.priceRisk.available ? (
            <>
              <PriceRiskCases scenarios={b.priceRisk} compact />
              <p className="edge-caption">
                Historical price risk, not a business valuation.
              </p>
            </>
          ) : (
            <p>{b.value.reason}</p>
          )}
          <AnalystTargets research={r} />
        </section>
      </div>
      <section className="edge-metrics" aria-label="Business evidence">
        {[
          {
            label: "Revenue growth",
            value: percent(b.businessNumbers.revenueGrowth),
            note: "Comparable reported periods",
            help: "Change in reported revenue between comparable periods. Growth can reflect acquisitions or currency effects as well as demand.",
            tone:
              (b.businessNumbers.revenueGrowth ?? 0) < 0 ? "risk" : "neutral",
          },
          {
            label: "FCF margin",
            value: percent(fcfMargin),
            note: p ? `Period ending ${dateLabel(p.end)}` : "Not available",
            help: "Operating cash flow less capital spending, divided by revenue. Capital-intensive businesses can show negative cash after investment without a unit error; inspect the actual cash-flow lines.",
            tone:
              fcfMargin == null
                ? "neutral"
                : fcfMargin < 0
                  ? "risk"
                  : "positive",
          },
          {
            label: "Cash conversion",
            value: percent(cashConversion),
            note: "FCF / positive net income",
            help: "Compares free cash flow with positive net income over the same period. Timing and working capital can move it sharply. Not calculated when net income is zero or negative.",
            tone: "neutral",
          },
          {
            label: "Share count change",
            value: percent(b.businessNumbers.dilution, true),
            note: "Review period and share basis",
            help: "An increase in shares can dilute ownership. Stock splits and changes in listing units must be reconciled before interpreting it.",
            tone:
              b.businessNumbers.dilution != null &&
              b.businessNumbers.dilution > 0
                ? "caution"
                : "neutral",
          },
        ].map((m) => (
          <div key={m.label} data-tone={m.tone}>
            <Help label={m.label} trigger={m.label}>
              {m.help}
            </Help>
            <strong>{m.value}</strong>
            <small>{m.note}</small>
          </div>
        ))}
      </section>
      <div className="edge-bottom">
        <section>
          <span className="edge-eyebrow">TURNING POINT</span>
          <h3>
            {next
              ? `Earnings · ${dateLabel(next.date)}`
              : "Evidence to revisit"}
          </h3>
          <p>{edge.turningPoint}</p>
          <button
            className="text-button"
            onClick={() => onTab(next ? "News" : "Thesis")}
          >
            Review evidence →
          </button>
        </section>
        <section data-tone="caution">
          <span className="edge-eyebrow">KEY RISK</span>
          <p>{edge.risk}</p>
        </section>
      </div>
    </section>
  );
}
