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
  const specialist = [
    "financial",
    "insurance",
    "specialized-financial",
    "real-estate",
  ].includes(b.coverage.family);
  const fcfMargin =
    !specialist && p?.revenue != null && p.revenue > 0 && p.fcf != null
      ? (p.fcf / p.revenue) * 100
      : null;
  const cashConversion =
    !specialist && p?.netIncome != null && p.netIncome > 0 && p.fcf != null
      ? (p.fcf / p.netIncome) * 100
      : null;
  const next = r.evidence?.earnings
    ?.filter((e) => e.date >= r.retrievedAt.slice(0, 10))
    .sort((a, z) => a.date.localeCompare(z.date))[0];
  const price = r.quote.price;
  const baseChange =
    b.scenarioEligible && b.scenario && price != null && price > 0
      ? (b.scenario.base / price - 1) * 100
      : null;
  const month = (v: string | null | undefined) =>
    v && /^\d{4}-\d{2}$/.test(v)
      ? new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(v + "-01T12:00:00Z"))
      : "Latest completed month";
  const businessTitle =
    edge.business === "strong"
      ? "Cash generation supports the business"
      : edge.business === "weak"
        ? "Operating evidence needs attention"
        : specialist
          ? "Use the sector-specific evidence"
          : b.businessNumbers.revenueGrowth != null &&
              b.businessNumbers.revenueGrowth > 0
            ? "Revenue is growing. Check how growth is funded."
            : "Understand the business and its funding";
  const timingTitle =
    edge.timing === "favorable"
      ? "Price trend is constructive"
      : edge.timing === "extended"
        ? "Momentum is stretched"
        : "Entry conditions are mixed";
  const supporting = b.support.length ? b.support : [b.business.reason];
  const limits = b.checks
    .filter((c) => c.status === "conflicting")
    .map((c) => c.detail);
  const scenarioCaution = b.scenarioEligible && b.scenario && edge.value === 'unestablished'
    ? 'The model assumptions need closer review: the range is unusually optimistic relative to today’s price. These values remain visible as sensitivities, not an established entry cushion.'
    : null;
  const risk = limits[0] ?? scenarioCaution ?? edge.risk;
  const cases =
    b.scenario && b.scenarioEligible
      ? ["Bear", "Base", "Bull"].map((name, i) => ({
          name,
          target: [b.scenario!.low, b.scenario!.base, b.scenario!.high][i],
          change:
            price != null && price > 0
              ? ([b.scenario!.low, b.scenario!.base, b.scenario!.high][i] /
                  price -
                  1) *
                100
              : 0,
        }))
      : [];
  const metrics = [
    {
      label: "Revenue growth",
      value: b.businessNumbers.revenueGrowth,
      note: "Comparable reported periods",
      help: "Change in revenue between comparable periods. Acquisitions and currency movements can affect growth.",
      tone: "neutral",
    },
    {
      label: "FCF margin",
      value: fcfMargin,
      note: p ? `Period ending ${dateLabel(p.end)}` : "",
      help:
        p && p.revenue != null && p.fcf != null
          ? `${amount(p.fcf, p.currency, true)} free cash flow ÷ ${amount(p.revenue, p.currency, true)} revenue. Free cash flow is operating cash flow less capital spending. Investment spending can make it negative even when operations generate cash.`
          : "Free cash flow divided by revenue. Inspect operating cash and investment spending separately.",
      tone: fcfMargin != null && fcfMargin < 0 ? "risk" : "positive",
    },
    {
      label: "Cash conversion",
      value: cashConversion,
      note: "FCF / positive net income",
      help: "How much reported profit becomes free cash flow. Working capital and investment timing can change this sharply.",
      tone: "neutral",
    },
    {
      label: "Share count change",
      value: b.businessNumbers.dilution,
      note: "Review period and share basis",
      help: "More shares can dilute ownership. Splits and listing units must be reconciled before interpreting the change.",
      tone: (b.businessNumbers.dilution ?? 0) > 0 ? "caution" : "neutral",
    },
  ].filter((m) => m.value != null && Number.isFinite(m.value));
  return (
    <section className="edge-overview" aria-label="Stock overview">
      <section className="edge-verdict" data-tone={edge.tone}>
        <header>
          <span className="edge-eyebrow">
            AURYN VIEW <small>· evidence-led assessment</small>
          </span>
          <div>
            {modeControl}
            <Help
              label="AURYN Crosscheck"
              trigger={
                b.conflicting
                  ? "Check affected inputs"
                  : "How the evidence fits"
              }
            >
              <p>Checks describe input consistency, not guaranteed accuracy.</p>
              {b.checks.map((c) => (
                <p key={c.label}>
                  <strong>{c.label}</strong> · {c.status}
                  <br />
                  {c.detail}
                </p>
              ))}
            </Help>
          </div>
        </header>
        <h2>{edge.assessment}</h2>
        <p>{edge.reason}</p>
        {edge.referenceBasis === "settled-close" && (
          <small>
            Uses the dated settled close, not a live execution price.
          </small>
        )}
        <div className="edge-readings">
          <button
            type="button"
            className="edge-evidence-link"
            data-tone={edge.business === "strong" ? "positive" : "neutral"}
            onClick={() => onTab("Thesis")}
          >
            <span>01 · BUSINESS</span>
            <strong>{businessTitle}</strong>
            <small>
              {b.businessNumbers.revenueGrowth != null
                ? `${percent(b.businessNumbers.revenueGrowth, true)} revenue growth`
                : b.coverage.drivers.slice(0, 2).join(" · ")}
              {fcfMargin != null ? ` · ${percent(fcfMargin)} FCF margin` : ""}
            </small>
            <span className="edge-link-label">Read the operating case →</span>
          </button>
          <button
            type="button"
            className="edge-evidence-link"
            data-tone="neutral"
            onClick={() => onTab("Valuation")}
          >
            <span>02 · PRICE</span>
            <strong>
              {baseChange != null
                ? `${percent(baseChange, true)} to the model base case`
                : "Test what today’s price requires"}
            </strong>
            <small>
              {baseChange != null
                ? "Conditional scenario, not a guaranteed target"
                : b.conflicting
                  ? "Listing inputs need reconciliation; price history remains usable."
                  : "Compare expectations, analyst targets and the downside assumptions."}
            </small>
            <span className="edge-link-label">Explore the assumptions →</span>
          </button>
          <button
            type="button"
            className="edge-evidence-link"
            data-tone={edge.timing === "extended" ? "caution" : "neutral"}
            onClick={() => onTab("Technicals")}
          >
            <span>03 · TIMING</span>
            <strong>{timingTitle}</strong>
            <small>
              {b.timing.rsi != null
                ? `RSI ${b.timing.rsi.toFixed(0)} · ${b.timing.trend} trend`
                : "Use the dated chart and price levels below."}
            </small>
            <span className="edge-link-label">
              See the technical evidence →
            </span>
          </button>
        </div>
      </section>
      <section
        className="edge-conviction"
        aria-label="What limits this assessment"
      >
        <strong>Why not stronger?</strong>
        <p>{risk}</p>
        <button
          className="text-button"
          onClick={() => onTab(limits.length ? "Valuation" : "Thesis")}
        >
          Inspect the evidence →
        </button>
      </section>
      <section
        className="edge-pace"
        aria-label="Price-based contribution readings"
      >
        <div className="edge-pace-identity">
          <span className="edge-eyebrow">AURYN PACE</span>
          <h3>Your price-based accumulation reading</h3>
          <Help label="AURYN Pace" trigger="Learn Pace">
            <p>
              1× means your regular contribution; 2×–4× are larger multiples,
              not leverage or predicted returns. 0× means the price policy
              pauses additions; it does not mean sell.
            </p>
            <p>
              The completed-month reading is final for that month. This month’s
              developing reading can change. Business risks and suitable
              position size must be reviewed separately.
            </p>
            <p>{b.accumulation.reason}</p>
          </Help>
        </div>
        <div className="edge-pace-reading">
          <small>Completed month · {month(b.accumulation.month)}</small>
          <strong>
            {edge.pace != null ? `${edge.pace}×` : "Review daily conditions"}
          </strong>
          <span>
            {edge.pace === 0
              ? "Price policy pauses additions"
              : edge.pace != null
                ? "Completed monthly price signal"
                : "A monthly signal needs consecutive month-end observations."}
          </span>
        </div>
        <div className="edge-pace-reading">
          <small>This month so far</small>
          <strong>
            {edge.formingPace != null
              ? `${edge.formingPace}×`
              : "Follow the next close"}
          </strong>
          <span>
            {b.accumulation.forming?.month
              ? month(b.accumulation.forming.month) + " · "
              : ""}
            Developing · not final
          </span>
        </div>
        <p className="edge-pace-explanation">
          2× means twice your regular contribution—not twice the return.{" "}
          <strong>Business risks reviewed separately.</strong>
        </p>
      </section>
      <div className="edge-market">
        <section className="edge-chart research-canvas">
          <header>
            <h3>Price in context</h3>
            <button className="text-button" onClick={() => onTab("Technicals")}>
              Levels & studies →
            </button>
          </header>
          {chart}
        </section>
        <section className="edge-scenarios">
          <header>
            <h3>
              {cases.length
                ? "AURYN model scenarios"
                : b.priceRisk.available
                  ? "Historical price outcomes"
                  : "Price and expectations"}
            </h3>
            <button className="text-button" onClick={() => onTab("Valuation")}>
              Explore →
            </button>
          </header>
          {cases.length ? (
            <>
              <CaseRange
                cases={cases}
                price={price}
                currency={b.scenario?.currency ?? r.quote.currency}
              />
              <p className="edge-caption">
                Conditional company scenarios · horizon{" "}
                {dateLabel(b.scenario?.end)}. Assumptions may not occur.
              </p>
            </>
          ) : b.priceRisk.available ? (
            <>
              <PriceRiskCases scenarios={b.priceRisk} compact />
              <p className="edge-caption">
                Historical price distribution, not business fair value. Sample
                limitations matter.
              </p>
            </>
          ) : (
            <p className="edge-caption">
              Read the available company evidence and compare the assumptions
              required by today’s price. A numeric valuation needs a suitable
              model and reconciled inputs.
            </p>
          )}
          <AnalystTargets research={r} />
        </section>
      </div>
      {metrics.length > 0 && (
        <section className="edge-metrics" aria-label="Business evidence">
          {metrics.map((m) => (
            <div key={m.label} data-tone={m.tone}>
              <Help label={m.label} trigger={m.label}>
                {m.help}
              </Help>
              <strong>
                {percent(m.value, m.label === "Share count change")}
              </strong>
              <small>{m.note}</small>
            </div>
          ))}
        </section>
      )}
      <div className="edge-bottom">
        <section>
          <span className="edge-eyebrow">AURYN CHECKPOINTS</span>
          <h3>
            {next
              ? `Next earnings · ${dateLabel(next.date)}`
              : "What changes the view?"}
          </h3>
          <p>{edge.turningPoint}</p>
          <button
            className="text-button"
            onClick={() => onTab(next ? "News" : "Thesis")}
          >
            Follow the evidence →
          </button>
        </section>
        <section>
          <span className="edge-eyebrow">THE SUPPORTING CASE</span>
          {supporting.slice(0, 2).map((x) => (
            <p key={x}>{x}</p>
          ))}
        </section>
      </div>
      {edge.disconnect && (
        <section className="edge-disconnect">
          <span className="edge-eyebrow">BUSINESS AND PRICE</span>
          <h3>{edge.disconnect.title}</h3>
          <p>{edge.disconnect.text}</p>
        </section>
      )}
      <details className="edge-method" open={pro}>
        <summary>How AURYN reaches this assessment</summary>
        <p>
          Business results, conditional valuation and price conditions are
          separate evidence. AURYN View describes their agreement and
          limitations, not a personalised order or probability of profit.
        </p>
        <p>
          Evidence confidence: {edge.confidence}. Policy {edge.version}.
          Research thresholds are experimental and not independently validated
          for investment performance.
        </p>
      </details>
    </section>
  );
}
