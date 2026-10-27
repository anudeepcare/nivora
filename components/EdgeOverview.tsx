"use client";
import { useMemo, type ReactNode } from "react";
import type { Research } from "@/lib/types";
import { researchEdge } from "@/lib/edge-research";
import { overviewEvidence } from "@/lib/overview-evidence";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help } from "./Ui";
import CaseRange from "./CaseRange";
import AnalystTargets from "./AnalystTargets";
import OverviewEvidence from "./OverviewEvidence";
import { EvidenceSeries } from "./EvidenceGraphics";
import { ShieldCheck, TriangleAlert, Sprout, ArrowUpRight } from "lucide-react";
import { useProduct } from "./Session";
import ResearchBalance from "./ResearchBalance";

type Tab =
  | "Thesis"
  | "Valuation"
  | "Technicals"
  | "News"
  | "Financials"
  | "Analysts"
  | "Advanced"
  | "Options";
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
  const edge = useMemo(() => researchEdge(r, ownsPosition), [r, ownsPosition]);
  const evidence = useMemo(() => overviewEvidence(r), [r]);
  const b = edge.brief,
    price = r.quote.price;
  const next = r.evidence?.earnings
    ?.filter((e) => e.date >= r.retrievedAt.slice(0, 10))
    .sort((a, z) => a.date.localeCompare(z.date))[0];
  const limits = b.checks
    .filter((c) => c.status === "conflicting")
    .map((c) => c.detail);
  const scenarioCaution =
    b.scenarioEligible && b.scenario && edge.value === "unestablished"
      ? "The model assumptions need closer review: this range is unusually optimistic relative to today’s price. These are sensitivities, not an established entry cushion."
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
              : null,
        }))
      : [];
  const priceCases = cases.length
    ? cases
    : b.priceRisk.available
      ? b.priceRisk.cases.map((c) => ({
          name: c.name,
          target: c.target,
          change: c.change,
        }))
      : [];
  const curve = b.trajectory.map((row) => ({
    label: row.end.slice(0, 4),
    value: row.revenue,
  }));
  const cashCurve = b.trajectory.map((row) => ({
    label: row.end.slice(0, 4),
    value: row.fcf,
  }));
  const month = (v: string | null | undefined) =>
    v && /^\d{4}-\d{2}$/.test(v)
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(v + "-01T12:00:00Z"))
      : "Latest completed month";
  return (
    <section
      className="edge-overview overview-fluid"
      aria-label="Stock overview"
    >
      <section className="edge-verdict" data-tone={edge.tone}>
        <div className="overview-answer">
          <span className="edge-eyebrow">AURYN VIEW</span>
          <h2>{edge.pacePresentation.actionLabel}</h2>
          <p>{edge.reason}</p>
          <div className="company-fingerprint" aria-label="Company fingerprint">
            <button onClick={()=>onTab("Thesis")}><span>Business</span><strong>{edge.businessLabel}</strong></button>
            <button onClick={()=>onTab("Valuation")}><span>Price</span><strong>{edge.valueLabel}</strong></button>
            <button onClick={()=>onTab("Technicals")}><span>Timing</span><strong>{edge.timingLabel}</strong></button>
          </div>
          {edge.referenceBasis === "settled-close" && (
            <small>
              Uses the dated settled close, not a live execution price.
            </small>
          )}
        </div>
        <div className="overview-pace-summary">
          <span className="edge-eyebrow">
            <Sprout size={15} /> AURYN PACE
          </span>
          <strong>
            {edge.pace != null ? `${edge.pace}×` : "History needed"}
            <small>
              {edge.pace === 0
                ? "Pause additions"
                : edge.pace === 1
                  ? "Usual contribution"
                  : edge.pace != null
                    ? "Larger contribution"
                    : "Monthly reading"}
            </small>
          </strong>
          <span>Completed monthly · {month(b.accumulation.month)}</span>
          {edge.formingPace != null && (
            <span>
              Developing: <b>{edge.formingPace}×</b> · can change
            </span>
          )}
          <Help label="AURYN Pace" trigger="How to read Pace">
            <p>
              P levels describe accumulation zones, not purchase multiples or
              leverage or predicted returns. 0× pauses additions under the price
              policy; it does not mean sell.
            </p>
            <p>
              The completed-month reading is final for that month. The
              developing month can change. Review business risk and position
              size separately.
            </p>
            <p>{b.accumulation.reason}</p>
          </Help>
        </div>
        <div className="overview-check">
          <Help
            label="AURYN Crosscheck"
            trigger={
              <>
                <ShieldCheck size={16} />
                {b.conflicting
                  ? "Check affected inputs"
                  : "Why this assessment"}
              </>
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
          {modeControl}
        </div>
      </section>
      <div className="overview-research-grid">
        <section
          className="overview-area overview-operating"
          aria-labelledby="overview-business-title"
        >
          <header>
            <h3 id="overview-business-title">
              {evidence.crypto
                ? "The asset case"
                : "Business & financial strength"}
            </h3>
            <button
              className="overview-area-action"
              onClick={() => onTab("Thesis")}
              aria-label="Explore the business case"
            >
              <ArrowUpRight size={18} />
            </button>
          </header>
          <p className="overview-interpretation">{b.business.reason}</p>
          {evidence.business.length > 0 ? (
            <div className="overview-operating-layout">
              <OverviewEvidence
                rows={evidence.business}
                label="Operating evidence"
              />
              {curve.some((v) => v.value != null) && (
                <div className="overview-mini-charts">
                  <EvidenceSeries
                    points={curve}
                    label="Annual revenue"
                    currency={evidence.currency}
                  />
                  {!evidence.specialist && (
                    <EvidenceSeries
                      points={cashCurve}
                      label="Annual free cash flow"
                      tone="green"
                      currency={evidence.currency}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="overview-context">
              <p>{b.coverage.method}</p>
              <button className="text-button" onClick={() => onTab("Thesis")}>
                Explore the asset and its risks →
              </button>
            </div>
          )}
          {evidence.period && (
            <small>
              Financial period ending {dateLabel(evidence.period)} ·{" "}
              {evidence.currency}
            </small>
          )}
        </section>
        <section
          className="overview-area overview-pricing"
          aria-labelledby="overview-price-title"
        >
          <header>
            <h3 id="overview-price-title">Price & expectations</h3>
            <button
              className="overview-area-action"
              onClick={() => onTab("Valuation")}
              aria-label="Explore price assumptions"
            >
              <ArrowUpRight size={18} />
            </button>
          </header>
          <p className="overview-interpretation">
            {cases.length
              ? "Conditional company scenarios. Read the assumptions before judging the upside."
              : b.priceRisk.available
                ? "Past price outcomes over comparable windows. Not a business valuation."
                : "Price context and company evidence remain separate when a suitable numeric model is not supported."}
          </p>
          {priceCases.length > 0 && (
            <>
              <CaseRange
                cases={priceCases}
                price={
                  cases.length
                    ? price
                    : b.priceRisk.available
                      ? b.priceRisk.reference
                      : price
                }
                referenceLabel={
                  cases.length
                    ? r.quote.stale
                      ? "Older quote"
                      : "Current"
                    : b.priceRisk.available
                      ? `${b.priceRisk.referenceBasis === "settled-close" ? "Settled close" : "Reference"} · ${dateLabel(b.priceRisk.referenceDate)}`
                      : "Reference"
                }
                currency={
                  cases.length
                    ? (b.scenario?.currency ?? r.quote.currency)
                    : b.priceRisk.available
                      ? b.priceRisk.currency
                      : r.quote.currency
                }
              />
              <small>
                {cases.length
                  ? `Scenario horizon: ${dateLabel(b.scenario?.end)}`
                  : `Historical price-risk horizon: ${b.priceRisk.available ? b.priceRisk.horizon : 20} sessions`}
                . Assumptions may not occur.
              </small>
            </>
          )}
          {scenarioCaution && (
            <p className="overview-caution">{scenarioCaution}</p>
          )}
          {!cases.length && b.priceRisk.available && (
            <details className="overview-range-basis">
              <summary>
                Basis & limits · {b.priceRisk.samples} historical windows
              </summary>
              <p>{b.priceRisk.caveat}</p>
              <p>
                Observed history {dateLabel(b.priceRisk.from)}–
                {dateLabel(b.priceRisk.through)}. Historical outcomes are not
                intrinsic value or probabilities.
              </p>
            </details>
          )}
          {evidence.valuation.length > 0 && (
            <OverviewEvidence
              rows={evidence.valuation}
              label="Reported valuation multiples"
            />
          )}
          <button className="text-button" onClick={() => onTab("Valuation")}>
            See scenarios & assumptions →
          </button>
        </section>
        <section
          className="overview-area overview-technical"
          aria-labelledby="overview-technical-title"
        >
          <header>
            <h3 id="overview-technical-title">Technical conditions</h3>
            <button
              className="overview-area-action"
              onClick={() => onTab("Technicals")}
              aria-label="Explore all technical studies"
            >
              <ArrowUpRight size={18} />
            </button>
          </header>
          <p className="overview-interpretation">
            {b.timing.trend === "Constructive"
              ? "Price trend is constructive. Confirm with momentum, volume and risk."
              : b.timing.trend === "Weak"
                ? "Price trend is weak. A lower price alone does not establish an entry."
                : "Read price trend, momentum and volatility together."}
          </p>
          <div className="overview-technical-layout">
            <div className="overview-price-chart">{chart}</div>
            <OverviewEvidence
              rows={evidence.technical}
              label="Technical observations"
            />
          </div>
        </section>
        <section
          className="overview-area overview-events"
          aria-labelledby="overview-events-title"
        >
          <header>
            <h3 id="overview-events-title">Ownership & upcoming events</h3>
            <button
              className="overview-area-action"
              onClick={() => onTab("News")}
              aria-label="Explore company events"
            >
              <ArrowUpRight size={18} />
            </button>
          </header>
          {evidence.ownership.length > 0 && (
            <OverviewEvidence
              rows={evidence.ownership}
              label="Reported ownership"
            />
          )}
          <div className="overview-checkpoint">
            <span className="edge-eyebrow">AURYN CHECKPOINTS</span>
            <strong>
              {next
                ? `Next earnings · ${dateLabel(next.date)}`
                : "What changes the view?"}
            </strong>
            <p>{edge.turningPoint}</p>
            <button
              className="text-button"
              onClick={() => onTab(next ? "News" : "Thesis")}
            >
              Review the next catalyst →
            </button>
          </div>
          <details className="overview-holder">
            <summary>
              {ownsPosition
                ? "For your existing position"
                : "If already holding"}
            </summary>
            <p>
              {edge.disconnect?.text ??
                "Separate the ownership thesis from the next purchase. Review total exposure and what would change your view."}
            </p>
            {(b.support.length ? b.support : [b.business.reason])
              .slice(0, 2)
              .map((x) => (
                <p key={x}>{x}</p>
              ))}
          </details>
        </section>
      </div>
      <section
        className="edge-conviction"
        aria-label="What limits this assessment"
      >
        <TriangleAlert size={18} />
        <strong>Why not stronger?</strong>
        <p>{risk}</p>
        <button
          className="text-button"
          onClick={() =>
            onTab(limits.length || scenarioCaution ? "Valuation" : "Thesis")
          }
        >
          Inspect the evidence →
        </button>
      </section>
      <ResearchBalance research={r} onTab={onTab} reading={edge} />
      <nav className="overview-explore" aria-label="Explore full research">
        <strong>Explore every metric</strong>
        {(
          [
            ["Financials", "Financial statements"],
            ["Thesis", "Business & moat"],
            ["Valuation", "Valuation models"],
            ["Analysts", "Analyst views"],
            ["Advanced", "Advanced studies"],
            ["Options", "Options & volatility"],
          ] as const
        ).map(([tab, label]) => (
          <button key={tab} onClick={() => onTab(tab)}>
            {label}
            <ArrowUpRight size={14} />
          </button>
        ))}
      </nav>
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
        <p>
          2× means twice your regular contribution—not twice the return.
          Business risks are reviewed separately.
        </p>
        <AnalystTargets research={r} />
      </details>
    </section>
  );
}
