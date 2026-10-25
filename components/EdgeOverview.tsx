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
import { EvidenceSeries, RsiGraphic } from "./EvidenceGraphics";
import { overviewValueMessage } from "@/lib/evidence-graphics";
import {
  ArrowUpRight,
  ShieldCheck,
  TriangleAlert,
  Sprout,
  ChartNoAxesCombined,
  BookOpen,
  CalendarDays,
} from "lucide-react";
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
  const scenarioCaution =
    b.scenarioEligible && b.scenario && edge.value === "unestablished"
      ? "The model assumptions need closer review: the range is unusually optimistic relative to today’s price. These values remain visible as sensitivities, not an established entry cushion."
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
  const valueTitle =
    !b.scenarioEligible && b.priceRisk.available
      ? "Historical price context"
      : overviewValueMessage(edge.value, baseChange);
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
    value:
      row.fcf != null && row.revenue != null && row.revenue > 0
        ? (row.fcf / row.revenue) * 100
        : null,
  }));
  return (
    <section className="edge-overview" aria-label="Stock overview">
      <section className="edge-verdict" data-tone={edge.tone}>
        <header>
          <span className="edge-eyebrow">
            AURYN VIEW <small>· evidence-led assessment</small>
          </span>
          <Help
            label="AURYN Crosscheck"
            trigger={
              <>
                <ShieldCheck size={14} />
                {b.conflicting
                  ? "Check affected inputs"
                  : "How the evidence fits"}
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
        </header>
        <h2>{edge.assessment}</h2>
        <p>{edge.reason}</p>
        {edge.referenceBasis === "settled-close" && (
          <small>
            Uses the dated settled close, not a live execution price.
          </small>
        )}
      </section>
      <div className="edge-readings">
        <section className="edge-evidence-link" data-domain="business">
          <button
            className="evidence-card-title"
            onClick={() => onTab("Thesis")}
          >
            <span className="evidence-number">1</span>
            <strong>{businessTitle}</strong>
            <ArrowUpRight size={16} />
          </button>
          <p>{b.business.reason}</p>
          {curve.some((v) => v.value != null) ? (
            <div className="edge-mini-pair">
              <EvidenceSeries
                points={curve}
                label="Annual revenue"
                currency={b.businessNumbers.currency}
              />
              <EvidenceSeries
                points={cashCurve}
                label="FCF margin"
                kind="line"
                tone="green"
                format="percent"
              />
            </div>
          ) : (
            <div className="edge-sector-evidence">
              <strong>
                {b.coverage.family === "crypto"
                  ? "Network and price evidence"
                  : "Business-specific lenses"}
              </strong>
              <span>{b.coverage.drivers.slice(0, 3).join(" · ")}</span>
            </div>
          )}
          <button
            className="text-button edge-detail-link"
            onClick={() => onTab("Thesis")}
          >
            Read the operating case →
          </button>
        </section>
        <section className="edge-evidence-link" data-domain="price">
          <button
            className="evidence-card-title"
            onClick={() => onTab("Valuation")}
          >
            <span className="evidence-number">2</span>
            <strong>{valueTitle}</strong>
            <ArrowUpRight size={16} />
          </button>
          <p>
            {!b.scenarioEligible && b.priceRisk.available
              ? "Past price outcomes over comparable windows. Not a business valuation."
              : edge.value === "unestablished"
                ? "Use the assumptions and downside evidence before treating model upside as an opportunity."
                : baseChange != null
                  ? `Base ${amount(b.scenario?.base ?? null, b.scenario?.currency ?? r.quote.currency)} versus ${amount(price, r.quote.currency)} today. Conditional, not a guaranteed target.`
                  : "Compare business expectations with what the price requires."}
          </p>
          {priceCases.length > 0 &&
          (edge.value !== "unestablished" || !b.scenarioEligible) ? (
            <div className="edge-compact-range">
              <CaseRange
                cases={priceCases}
                price={price}
                currency={
                  cases.length
                    ? (b.scenario?.currency ?? r.quote.currency)
                    : b.priceRisk.available
                      ? b.priceRisk.currency
                      : r.quote.currency
                }
              />
            </div>
          ) : (
            <div className="edge-price-review">
              <span>Current price</span>
              <strong>{amount(price, r.quote.currency)}</strong>
              <span>
                {b.scenarioEligible && b.scenario
                  ? "Model sensitivity needs review"
                  : b.priceRisk.available
                    ? "Historical downside context available below"
                    : "Company evidence and analyst context below"}
              </span>
              <small>
                {b.scenarioEligible && b.scenario
                  ? "A wide upside range does not establish fair value."
                  : "Different models answer different questions."}
              </small>
            </div>
          )}
          <button
            className="text-button edge-detail-link"
            onClick={() => onTab("Valuation")}
          >
            Explore the assumptions →
          </button>
        </section>
        <section className="edge-evidence-link" data-domain="timing">
          <button
            className="evidence-card-title"
            onClick={() => onTab("Technicals")}
          >
            <span className="evidence-number">3</span>
            <strong>{timingTitle}</strong>
            <ArrowUpRight size={16} />
          </button>
          <p>
            {b.timing.trend} trend. Price studies describe entry conditions, not
            the strength of the business.
          </p>
          <RsiGraphic value={b.timing.rsi} />
          <dl className="edge-ma-list">
            {[
              { label: "Price", value: price },
              { label: "50-day average", value: b.timing.ma50 },
              { label: "200-day average", value: b.timing.ma200 },
            ]
              .filter((x) => x.value != null)
              .map((x) => (
                <div key={x.label}>
                  <dt>{x.label}</dt>
                  <dd>{amount(x.value, r.quote.currency)}</dd>
                </div>
              ))}
          </dl>
          <button
            className="text-button edge-detail-link"
            onClick={() => onTab("Technicals")}
          >
            See the technical evidence →
          </button>
        </section>
      </div>
      <section
        className="edge-conviction"
        aria-label="What limits this assessment"
      >
        <span className="edge-risk-symbol">
          <TriangleAlert size={20} />
        </span>
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
      <div className="edge-action-grid">
        <section
          className="edge-pace"
          aria-label="Price-based contribution readings"
        >
          <header>
            <span className="edge-section-icon">
              <Sprout size={20} />
            </span>
            <div>
              <span className="edge-eyebrow">AURYN PACE</span>
              <h3>If considering an addition</h3>
            </div>
            <Help label="AURYN Pace" trigger="Learn Pace">
              <p>
                1× means your regular contribution; 2×–4× are larger multiples,
                not leverage or predicted returns. 0× means the price policy
                pauses additions; it does not mean sell.
              </p>
              <p>
                The completed-month reading is final for that month. This
                month’s developing reading can change. Business risks and
                suitable position size must be reviewed separately.
              </p>
              <p>{b.accumulation.reason}</p>
            </Help>
          </header>
          <div className="edge-pace-track" aria-hidden="true">
            <i />
            {[0, 1, 2, 3, 4].map((n) => (
              <span
                key={n}
                data-selected={edge.pace === n}
                data-forming={edge.formingPace === n}
              >
                {n}×
              </span>
            ))}
          </div>
          <div className="edge-pace-pair">
            <div className="edge-pace-reading">
              <strong>
                {edge.pace != null ? `${edge.pace}×` : "Daily evidence"}
              </strong>
              <span>Completed monthly price signal</span>
              <small>{month(b.accumulation.month)}</small>
            </div>
            <div className="edge-pace-reading">
              <strong>
                {edge.formingPace != null
                  ? `${edge.formingPace}×`
                  : "Next close"}
              </strong>
              <span>Developing · not final</span>
              <small>
                {b.accumulation.forming?.month
                  ? month(b.accumulation.forming.month)
                  : "Current month"}
              </small>
            </div>
          </div>
          <p className="edge-pace-explanation">
            {edge.pace === 0 ? "Price policy pauses additions. " : ""}2× means
            twice your regular contribution—not twice the return. Business risks
            reviewed separately.
          </p>
        </section>
        <section className="edge-holder">
          <header>
            <span className="edge-section-icon">
              <ChartNoAxesCombined size={20} />
            </span>
            <h3>If already holding</h3>
          </header>
          <strong>
            {ownsPosition ? edge.assessment : "Review the ownership case"}
          </strong>
          <p>
            {edge.disconnect?.text ??
              "Separate the business thesis from the next purchase. Review position size and the assumptions that would change your view."}
          </p>
          <ul>
            <li>Monitor the next operating results.</li>
            <li>Check valuation before adding.</li>
            <li>Reassess if the evidence weakens.</li>
          </ul>
        </section>
        <section className="edge-explainer">
          <header>
            <span className="edge-section-icon">
              <BookOpen size={20} />
            </span>
            <h3>
              {metrics.some((m) => m.label === "FCF margin")
                ? "What does FCF margin mean?"
                : "Read the evidence in context"}
            </h3>
          </header>
          {metrics.find((m) => m.label === "FCF margin") ? (
            <>
              <strong>
                {amount(p?.fcf ?? null, p?.currency ?? r.quote.currency, true)}{" "}
                cash flow /{" "}
                {amount(
                  p?.revenue ?? null,
                  p?.currency ?? r.quote.currency,
                  true,
                )}{" "}
                revenue = {percent(fcfMargin)}
              </strong>
              <p>
                Cash left after capital spending for each dollar of revenue.
                Working capital and investment timing still matter.
              </p>
              <Help
                label="FCF margin calculation"
                trigger="See calculation and period"
              >
                {metrics.find((m) => m.label === "FCF margin")?.help}
                <p>Financial period ending {dateLabel(p?.end)}.</p>
              </Help>
            </>
          ) : (
            <>
              <p>{b.coverage.method}</p>
              <Help
                label="Business-specific evidence"
                trigger="How to interpret this"
              >
                {b.business.reason}
              </Help>
            </>
          )}
        </section>
      </div>
      <div className="edge-bottom">
        <section>
          <span className="edge-section-icon">
            <CalendarDays size={19} />
          </span>
          <div>
            <span className="edge-eyebrow">AURYN CHECKPOINTS</span>
            <h3>
              {next
                ? `Next earnings · ${dateLabel(next.date)}`
                : "What changes the view?"}
            </h3>
            <p>{edge.turningPoint}</p>
          </div>
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
                ? "Model sensitivities"
                : b.priceRisk.available
                  ? "Historical price outcomes"
                  : "Price and expectations"}
            </h3>
            <button className="text-button" onClick={() => onTab("Valuation")}>
              Explore →
            </button>
          </header>
          {scenarioCaution && (
            <p className="edge-scenario-caution">{scenarioCaution}</p>
          )}
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
              A numeric valuation needs a suitable model and reconciled inputs.
              The business and price evidence remain available independently.
            </p>
          )}
          <AnalystTargets research={r} />
        </section>
      </div>
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
        <div className="edge-metrics">
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
        </div>
      </details>
    </section>
  );
}
