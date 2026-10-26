"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Bookmark, Bell, RotateCcw } from "lucide-react";
import type { Research } from "@/lib/types";
import {
  approvedResearch,
  balanceView,
  type BalanceFactor,
  type EvidenceSection,
} from "@/lib/approved-research";
import type { OverviewMetric } from "@/lib/overview-evidence";
import { amount, percent, dateLabel } from "@/lib/format";
import { useProduct } from "./Session";
import { Help } from "./Ui";
type Props = {
  research: Research;
  onTab: (tab: EvidenceSection) => void;
  chart?: ReactNode;
  pro?: boolean;
};
// Normalize trigonometric SVG coordinates across server and browser math engines.
const svgCoordinate = (value: number) => Number(value.toFixed(3));
const impactLabel = (weight: number) =>
  weight >= 4
    ? "Very high impact"
    : weight >= 3
      ? "High impact"
      : weight >= 2
        ? "Moderate impact"
        : "Low impact";
function metricValue(m: OverviewMetric) {
  return m.unit === "money"
    ? amount(m.value, m.currency, true)
    : m.unit === "percent"
      ? percent(m.value)
      : m.unit === "ratio"
        ? `${m.value.toFixed(2)}×`
        : m.value.toFixed(1);
}
function Metrics({ items }: { items: OverviewMetric[] }) {
  return (
    <>
      {items.map((m) => (
        <div className="metric" key={m.key}>
          <span>
            {m.label} <Help label={m.label}>{m.help}</Help>
          </span>
          <strong className={m.tone === "risk" ? "red" : ""}>
            {metricValue(m)}
          </strong>
        </div>
      ))}
    </>
  );
}
function Scale({
  factors,
  excluded,
}: {
  factors: BalanceFactor[];
  excluded: string[];
}) {
  const s = balanceView(factors, excluded),
    angle = (s.angle * Math.PI) / 180;
  return (
    <svg
      className="evidence-scale"
      viewBox="0 0 600 340"
      role="img"
      aria-label={`Evidence balance: ${s.buyCount} ${s.buyCount === 1 ? "reason" : "reasons"} to buy, ${s.waitCount} ${s.waitCount === 1 ? "reason" : "reasons"} to wait. Circle size represents qualitative importance, not probability or Pace.`}
    >
      <path
        d="M300 80V310M246 310H354"
        stroke="var(--scale-post)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M145 80H455"
        transform={`rotate(${s.angle} 300 80)`}
        className="scale-beam"
        stroke="var(--ink)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {(["buy", "wait"] as const).map((side) => {
        const sign = side === "buy" ? -1 : 1,
          cx = svgCoordinate(300 + sign * 155 * Math.cos(angle)),
          anchor = svgCoordinate(80 + sign * 155 * Math.sin(angle)),
          pan = anchor + 163,
          color = side === "buy" ? "var(--green)" : "var(--amber)";
        return (
          <g key={side}>
            <path
              d={`M${cx} ${anchor}L${cx - 112} ${pan}M${cx} ${anchor}L${cx + 112} ${pan}`}
              stroke="#91a7ff"
              strokeWidth="1.8"
              fill="none"
            />
            {factors
              .filter((x) => x.side === side && !excluded.includes(x.id))
              .map((x, i, active) => {
                const row = Math.floor(i / 3),
                  columns = Math.min(3, active.length - row * 3),
                  radius = 14 + x.weight * 5,
                  X = cx + ((i % 3) - (columns - 1) / 2) * 65,
                  Y = pan - radius - 3 - row * 68;
                return (
                  <g key={x.id}>
                    <title>{`${x.text} · ${impactLabel(x.weight)}`}</title>
                    <circle cx={X} cy={Y} r={radius} fill={color} />
                    <text
                      x={X}
                      y={Y + 5}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="14"
                      fontWeight="650"
                    >
                      {side === "buy" ? "✓" : "!"}
                    </text>
                  </g>
                );
              })}
            <path
              d={`M${cx - 112} ${pan}H${cx + 112}`}
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
            />
            <text
              x={cx}
              y={pan + 28}
              textAnchor="middle"
              fill={color}
              fontSize="15"
              fontWeight="650"
            >
              Reasons to {side}
            </text>
          </g>
        );
      })}
      <circle
        cx="300"
        cy="80"
        r="12"
        fill="var(--blue)"
        stroke="var(--card)"
        strokeWidth="4"
      />
    </svg>
  );
}
function Projection({
  research: r,
  cases,
}: {
  research: Research;
  cases: ReturnType<typeof approvedResearch>["cases"];
}) {
  const bars = r.history
    .filter((x) => Number.isFinite(x.close) && x.close > 0)
    .slice(-252);
  if (bars.length < 2) return null;
  const values = [...bars.map((x) => x.close), ...cases.map((x) => x.target)],
    min = Math.min(...values) * 0.94,
    max = Math.max(...values) * 1.06,
    y = (v: number) => 24 + ((max - v) / (max - min || 1)) * 240,
    last = bars.at(-1)!,
    end = cases.length ? 680 : 970,
    path = bars
      .map(
        (b, i) =>
          `${i ? "L" : "M"}${40 + (i / (bars.length - 1)) * (end - 40)} ${y(b.close)}`,
      )
      .join(" ");
  return (
    <svg
      className="data-chart"
      viewBox="0 0 1000 320"
      role="img"
      aria-label={`${r.company.symbol} actual historical prices${cases.length ? " joined to hypothetical scenario paths" : ""}`}
    >
      <defs>
        <linearGradient id="approved-price-fill" x2="0" y2="1">
          <stop stopColor="var(--blue)" stopOpacity=".14" />
          <stop offset="1" stopColor="var(--blue)" stopOpacity=".02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => {
        const v = min + ((max - min) * i) / 3;
        return (
          <g key={i}>
            <line x1="40" x2="980" y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x="1" y={y(v) + 5} className="chart-label">
              {v.toLocaleString("en-US", {
                maximumFractionDigits: v < 10 ? 2 : 0,
              })}
            </text>
          </g>
        );
      })}
      <path d={`${path}L${end} 274L40 274Z`} fill="url(#approved-price-fill)" />
      <path d={path} fill="none" stroke="var(--blue)" strokeWidth="3.4" />
      {cases.map((c, i) => (
        <g key={c.name}>
          <path
            d={`M${end} ${y(last.close)}L975 ${y(c.target)}`}
            fill="none"
            stroke={["var(--red)", "var(--blue)", "var(--green)"][i]}
            strokeWidth="2.5"
            strokeDasharray="7 6"
          />
          <text
            x="964"
            y={y(c.target) - 10}
            textAnchor="end"
            fill={["var(--red)", "var(--blue)", "var(--green)"][i]}
            fontSize="17"
          >
            {amount(c.target, r.quote.currency)}
          </text>
        </g>
      ))}
      <circle
        cx={end}
        cy={y(last.close)}
        r="5"
        fill="var(--blue)"
        stroke="var(--card)"
        strokeWidth="3"
      />
      <text x="40" y="310" className="chart-label">
        {dateLabel(bars[0].time)}
      </text>
      <text x={cases.length ? 700 : 820} y="310" className="chart-label">
        {cases.length ? "Hypothetical paths" : dateLabel(last.time)}
      </text>
    </svg>
  );
}
const sections: [EvidenceSection, string, string][] = [
  [
    "Thesis",
    "Business & ownership",
    "Business model, competitive position and holders",
  ],
  ["Financials", "Financials", "Statements, margins, cash flow and funding"],
  ["Valuation", "Value", "Assumptions, sensitivities and price context"],
  [
    "Technicals",
    "Price & Pace",
    "Price charts, studies and monthly accumulation",
  ],
  ["Analysts", "Analysts", "Ratings, estimates and target distribution"],
  ["News", "News & earnings", "Company updates and the next checkpoint"],
  [
    "Options",
    "Options & LEAPS",
    "Chains, expiry, liquidity and scenario payoffs",
  ],
  [
    "Advanced",
    "Advanced research",
    "Risk, dilution, expectations and research tools",
  ],
];
export default function ApprovedResearch({ research: r, onTab, chart }: Props) {
  const { workspace, demo } = useProduct(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const owns = !!workspace?.positions.some(
      (p) => p.symbol === r.company.symbol && p.quantity > 0,
    ),
    m = useMemo(() => approvedResearch(r, owns), [r, owns]),
    { edge, evidence } = m;
  const [excluded, setExcluded] = useState<string[]>([]),
    [lens, setLens] = useState<"investor" | "trader">("investor"),
    [focus, setFocus] = useState<
      "business" | "valuation" | "technical" | "ownership"
    >("business"),
    [investment, setInvestment] = useState(1500),
    [sleep, setSleep] = useState(""),
    [saved, setSaved] = useState("");
  useEffect(() => {
    setExcluded([]);
    setSaved("");
    setSleep("");
  }, [r.company.symbol]);
  const balance = balanceView(m.factors, excluded),
    b = edge.brief,
    focusItems = evidence[focus],
    toggle = (id: string) =>
      setExcluded((old) =>
        old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
      );
  function saveView() {
    try {
      localStorage.setItem(
        `auryn:research-view:${r.company.symbol}`,
        JSON.stringify({
          version: 1,
          symbol: r.company.symbol,
          excluded,
          lens,
          asOf: r.retrievedAt,
        }),
      );
      setSaved("View saved on this device.");
    } catch {
      setSaved("This browser could not save the view.");
    }
  }
  function restoreView() {
    try {
      const v = JSON.parse(
        localStorage.getItem(`auryn:research-view:${r.company.symbol}`) ||
          "null",
      );
      if (
        v?.version === 1 &&
        v.symbol === r.company.symbol &&
        Array.isArray(v.excluded)
      ) {
        setExcluded(
          v.excluded.filter(
            (id: unknown) =>
              typeof id === "string" && m.factors.some((f) => f.id === id),
          ),
        );
        setLens(v.lens === "trader" ? "trader" : "investor");
        setSaved("Saved view restored.");
      } else setSaved("Save a view first.");
    } catch {
      setSaved("The saved view could not be opened.");
    }
  }
  return (
    <div className="approved-research">
      <section className="card decision-card">
        <div className="decision-top">
          <div>
            <span className="eyebrow">
              SHOULD YOU BUY {r.company.name.toUpperCase()} NOW?
            </span>
            <h2>Weigh it yourself.</h2>
            <p>
              See what supports buying, what holds it back, and what changes the
              view.
            </p>
          </div>
          <div className="segment" aria-label="Investment lens">
            {(["investor", "trader"] as const).map((x) => (
              <button
                key={x}
                aria-pressed={lens === x}
                onClick={() => {
                  setLens(x);
                  setFocus(x === "trader" ? "technical" : "business");
                }}
              >
                {x === "investor" ? "Long-term investor" : "Trader"}
              </button>
            ))}
          </div>
        </div>
        <div className="decision-middle">
          <Scale factors={m.factors} excluded={excluded} />
          <div className="decision-verdict">
            <span className="eyebrow">
              THE AURYN VIEW ·{" "}
              {lens === "trader" ? "PRICE & RISK" : "BUSINESS & PRICE"}
            </span>
            <h3
              className={
                edge.tone === "positive"
                  ? "green"
                  : edge.tone === "risk"
                    ? "red"
                    : "amber"
              }
            >
              {lens === "trader"
                ? `${edge.timingLabel} price conditions.`
                : m.title}
            </h3>
            <p>
              {lens === "trader"
                ? `${b.timing.rsi != null ? `RSI is ${b.timing.rsi.toFixed(0)}. ` : ""}${edge.turningPoint}`
                : edge.reason}
            </p>
            <div className="score-line">
              <span>
                <i className="dot green-bg" />
                Buy reasons <b>{balance.buyCount}</b>
              </span>
              <span>
                <i className="dot amber-bg" />
                Wait reasons <b>{balance.waitCount}</b>
              </span>
            </div>
            <div className={`pace-chip ${edge.pace === 4 ? "strong" : ""}`}>
              <div>
                <span>AURYN PACE</span>
                <strong>
                  {edge.pace != null ? `${edge.pace}×` : "Developing"}
                </strong>
              </div>
              <p>
                {edge.pace === 4
                  ? "Strong accumulation signal"
                  : edge.pace === 0
                    ? "Pause new contributions"
                    : edge.pace === 1
                      ? "Regular accumulation"
                      : edge.pace != null
                        ? "Increased accumulation"
                        : "Follow the daily price evidence"}
                <small>
                  {b.accumulation.month
                    ? `Completed month · ${b.accumulation.month}`
                    : "24 completed monthly closes establish Pace"}
                </small>
                {edge.formingPace != null && (
                  <small>This month: {edge.formingPace}× · forming</small>
                )}
              </p>
              <button
                className="icon-button"
                onClick={() => onTab("Technicals")}
                aria-label="Understand Pace"
              >
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="inline-actions">
              <Link
                className="btn primary"
                href={`${prefix}/alerts?symbol=${encodeURIComponent(r.company.symbol)}`}
              >
                <Bell size={15} />
                Set a price alert
              </Link>
              <button className="btn" onClick={saveView}>
                <Bookmark size={15} />
                Save this view
              </button>
              <button
                className="icon-button"
                onClick={restoreView}
                aria-label="Restore saved view"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            {saved && (
              <p role="status" className="saved-view-status">
                {saved}
              </p>
            )}
          </div>
        </div>
        <div className="factor-grid">
          {(["buy", "wait"] as const).map((side) => (
            <div className="factor-column" key={side}>
              <h4 className={side === "buy" ? "green" : "amber"}>
                REASONS TO {side.toUpperCase()}
              </h4>
              {m.factors
                .filter((f) => f.side === side)
                .map((f) => (
                  <div
                    className={`factor ${side} ${excluded.includes(f.id) ? "excluded" : ""}`}
                    key={f.id}
                  >
                    <button
                      aria-pressed={!excluded.includes(f.id)}
                      aria-label={`Include ${f.text}`}
                      onClick={() => toggle(f.id)}
                    >
                      <span className="factor-check">
                        {excluded.includes(f.id) ? "+" : "✓"}
                      </span>
                      <span>{f.text}</span>
                      <small>{impactLabel(f.weight)}</small>
                    </button>
                    <button
                      className="factor-source"
                      onClick={() => onTab(f.section)}
                      aria-label={`Evidence for ${f.text}`}
                    >
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                ))}
              {!m.factors.some((f) => f.side === side) && (
                <p className="small">
                  {side === "buy"
                    ? "Open the evidence below to develop the case."
                    : "Review the instrument risks and your position size."}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="factor-foot">
          <span>
            Each circle is one reason; its size shows importance. Tap a reason
            to test your balance. This changes your view of the scale, not the
            research verdict or calculated Pace.
          </span>
          {excluded.length > 0 && (
            <button className="text-link" onClick={() => setExcluded([])}>
              Restore factors
            </button>
          )}
        </div>
      </section>
      {m.cases.length === 3 && (
        <section className="card outcome-card">
          <div className="section-head">
            <div>
              <h2>Before you decide: meet your future self.</h2>
              <p>See both outcomes before you commit.</p>
            </div>
            <span className="pill">
              Hypothetical ·{" "}
              {m.scenarioHorizon
                ? `${m.scenarioHorizon} sessions`
                : m.scenarioEnd
                  ? dateLabel(m.scenarioEnd)
                  : m.scenarioBasis}
            </span>
          </div>
          <div className="range-label">
            <label htmlFor="investment-size">If you invest</label>
            <output>{amount(investment, r.quote.currency)}</output>
          </div>
          <input
            id="investment-size"
            type="range"
            min="0"
            max="10000"
            step="100"
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
          />
          <div className="outcome-grid">
            {[m.cases[2], m.cases[0]].map((c) => (
              <article
                key={c.name}
                className={`outcome ${c.change < 0 ? "negative" : "positive"}`}
              >
                <span>IF THE {c.name.toUpperCase()} CASE HAPPENS</span>
                <strong>
                  {amount((investment * c.change) / 100, r.quote.currency)}
                </strong>
                <small>
                  Potential {c.change < 0 ? "loss" : "gain"} · Investment value{" "}
                  {amount(investment * (1 + c.change / 100), r.quote.currency)}
                </small>
                <p>
                  Scenario price {amount(c.target, r.quote.currency)} ·{" "}
                  {percent(c.change, true)} from{" "}
                  {amount(m.scenarioReference, r.quote.currency)} (
                  {dateLabel(m.scenarioReferenceDate)}), before fees and tax.
                </p>
              </article>
            ))}
          </div>
          <div className="sleep-test">
            <div>
              <strong>Could you leave it alone through the bad outcome?</strong>
              <p role="status">
                {sleep ||
                  "Your comfort with the downside belongs in the decision."}
              </p>
            </div>
            <div className="inline-actions">
              <button
                className="btn"
                onClick={() =>
                  setSleep(
                    "Keep your position size and time horizon in view as the evidence changes.",
                  )
                }
              >
                I could sleep fine
              </button>
              <button
                className="btn"
                onClick={() => {
                  setInvestment((v) => Math.round(v / 200) * 100);
                  setSleep(
                    "Try a smaller amount and see how the downside changes.",
                  );
                }}
              >
                It would bother me
              </button>
            </div>
          </div>
        </section>
      )}
      <section className="case-sentence">
        <div>
          <span className="eyebrow">THE CASE, CONNECTED</span>
          <h2>
            {r.company.name}:{" "}
            <button
              className={`word ${edge.business === "strong" ? "green-word" : edge.business === "weak" ? "red-word" : "blue-word"} ${focus === "business" ? "selected" : ""}`}
              aria-pressed={focus === "business"}
              aria-controls="connected-evidence"
              onClick={() => setFocus("business")}
            >
              {edge.businessLabel === "Sector evidence"
                ? "sector-specific evidence"
                : edge.business === "strong"
                  ? "strong business performance"
                  : edge.business === "weak"
                    ? "business performance under pressure"
                    : edge.business === "missing"
                      ? "business evidence is limited"
                      : "mixed business performance"}
            </button>
            {"; "}
            <button
              className={`word amber-word ${focus === "valuation" ? "selected" : ""}`}
              aria-pressed={focus === "valuation"}
              aria-controls="connected-evidence"
              onClick={() => setFocus("valuation")}
            >
              {edge.value === "supported"
                ? "valuation depends on growth assumptions"
                : edge.value === "demanding"
                  ? "the price needs sustained growth"
                  : "valuation needs more evidence"}
            </button>
            {"; "}
            <button
              className={`word ${edge.timing === "favorable" ? "green-word" : "blue-word"} ${focus === "technical" ? "selected" : ""}`}
              aria-pressed={focus === "technical"}
              aria-controls="connected-evidence"
              onClick={() => setFocus("technical")}
            >
              {edge.timing === "favorable"
                ? "the price trend is constructive"
                : edge.timing === "extended"
                  ? "momentum is stretched"
                  : "price signals are mixed"}
            </button>
            .
          </h2>
          <p className="sentence-hint">
            Tap the highlighted words to follow the evidence.
          </p>
        </div>
        <button
          className="approved-fingerprint-button"
          onClick={() => onTab("Thesis")}
          aria-label="Open company fingerprint evidence"
        >
          <svg
            className="fingerprint"
            viewBox="0 0 220 210"
            role="img"
            aria-label="Six business evidence lenses; missing scores are left unplotted"
          >
            <g fill="none" stroke="var(--line)">
              {[90, 60, 30].map((radius) => (
                <polygon
                  key={radius}
                  points={Array.from(
                    { length: 6 },
                    (_, i) =>
                      `${svgCoordinate(110 + radius * Math.sin((i * Math.PI) / 3))},${svgCoordinate(100 - radius * Math.cos((i * Math.PI) / 3))}`,
                  ).join(" ")}
                />
              ))}
              {m.fingerprint.map((f, i) => (
                <path
                  key={f.id}
                  d={`M110 100L${svgCoordinate(110 + 90 * Math.sin((i * Math.PI) / 3))} ${svgCoordinate(100 - 90 * Math.cos((i * Math.PI) / 3))}`}
                />
              ))}
            </g>
            {m.fingerprint.every((f) => f.score != null) && (
              <polygon
                points={m.fingerprint
                  .map(
                    (f, i) =>
                      `${svgCoordinate(110 + 9 * f.score! * Math.sin((i * Math.PI) / 3))},${svgCoordinate(100 - 9 * f.score! * Math.cos((i * Math.PI) / 3))}`,
                  )
                  .join(" ")}
                fill="#315ff422"
                stroke="var(--blue)"
                strokeWidth="2.5"
              />
            )}
            {m.fingerprint.map((f, i) =>
              f.score != null ? (
                <circle
                  key={f.id}
                  cx={svgCoordinate(
                    110 + 9 * f.score * Math.sin((i * Math.PI) / 3),
                  )}
                  cy={svgCoordinate(
                    100 - 9 * f.score * Math.cos((i * Math.PI) / 3),
                  )}
                  r="5"
                  fill="var(--blue)"
                  stroke="var(--card)"
                  strokeWidth="2"
                >
                  <title>{`${f.name}: ${f.score.toFixed(1)} / 10`}</title>
                </circle>
              ) : null,
            )}
            <text x="110" y="202" textAnchor="middle" className="chart-label">
              {m.fingerprint.filter((f) => f.score != null).length}/6 evidence
              lenses
            </text>
          </svg>
        </button>
      </section>
      <section id="connected-evidence" className="card sentence-evidence">
        <div className="section-head">
          <div>
            <h2>
              {focus === "business"
                ? "Inside the operating case"
                : focus === "valuation"
                  ? "What the price asks for"
                  : focus === "technical"
                    ? "Read the price conditions"
                    : "Who owns the business"}
            </h2>
            <p>
              {focus === "business"
                ? `Financial period ${dateLabel(evidence.period)} · ${evidence.currency}`
                : "Dated source observations; each metric includes its definition."}
            </p>
          </div>
          <button
            className="text-link"
            onClick={() =>
              onTab(
                (
                  {
                    business: "Financials",
                    valuation: "Valuation",
                    technical: "Technicals",
                    ownership: "Thesis",
                  } as const
                )[focus],
              )
            }
          >
            Open full evidence <ArrowUpRight size={15} />
          </button>
        </div>
        {focusItems.length ? (
          <div className="metrics-grid four">
            <Metrics items={focusItems.slice(0, 4)} />
          </div>
        ) : (
          <p>
            Use the dated price and source reports below while this part of the
            picture develops.
          </p>
        )}
      </section>
      <section className="card price-possibilities">
        <div className="section-head">
          <div>
            <h2>The price, and its possibilities.</h2>
            <p>
              {m.cases.length
                ? `${m.scenarioBasis} · ${m.scenarioEnd ? `to ${dateLabel(m.scenarioEnd)}` : `${m.scenarioHorizon} trading sessions`} · assumptions, not forecasts.`
                : "Actual historical observations, with chart studies in Price & Pace."}
            </p>
          </div>
          <button className="text-link" onClick={() => onTab("Technicals")}>
            Full chart <ArrowUpRight size={15} />
          </button>
        </div>
        <Projection research={r} cases={m.cases} />
        {r.history.length < 2 && chart}
        {m.cases.length > 0 && (
          <div className="case-grid">
            {m.cases.map((c, i) => (
              <button
                className={`case-tile ${["bear", "base", "bull"][i]}`}
                key={c.name}
                onClick={() =>
                  onTab(
                    m.scenarioBasis === "Earnings sensitivity"
                      ? "Valuation"
                      : "Technicals",
                  )
                }
              >
                <span>{c.name} case</span>
                <strong>{amount(c.target, r.quote.currency)}</strong>
                <small>
                  {percent(c.change, true)} from{" "}
                  {m.scenarioReferenceBasis === "settled-close"
                    ? "settled close"
                    : "dated quote"}
                </small>
              </button>
            ))}
          </div>
        )}
        <p className="sample-label">
          History: {r.historySource || "Dated price observations"} ·{" "}
          {dateLabel(r.history.at(-1)?.time)} · {r.quote.currency}
        </p>
      </section>
      {m.metrics.length > 0 && (
        <section className="card">
          <div className="section-head">
            <div>
              <h2>The numbers that shape the case.</h2>
              <p>
                Financial strength, valuation, price and ownership in one view.
              </p>
            </div>
            <span className="pill">{m.metrics.length} available metrics</span>
          </div>
          <div className="metrics-grid six">
            <Metrics items={m.metrics} />
          </div>
        </section>
      )}
      <div className="three-grid">
        <section className="card compact-card">
          <span className="eyebrow">BUSINESS & PRICE</span>
          <h3>
            {edge.value === "supported"
              ? "Growth assumptions drive the price case."
              : edge.value === "demanding"
                ? "The price asks for sustained growth."
                : "Read the assumptions behind the price."}
          </h3>
          <p>{edge.disconnect?.text || edge.reason}</p>
          <button className="text-link" onClick={() => onTab("Thesis")}>
            Read the business <ArrowUpRight size={15} />
          </button>
        </section>
        <section className="card compact-card">
          <span className="eyebrow">WHAT COULD CHANGE THE CASE</span>
          <h3>Keep the counter-case visible.</h3>
          <p>{edge.risk}</p>
          <button className="text-link" onClick={() => onTab("Financials")}>
            Follow the cash <ArrowUpRight size={15} />
          </button>
        </section>
        <section className="card compact-card">
          <span className="eyebrow">YOUR NEXT CHECKPOINT</span>
          <h3>Know what to revisit.</h3>
          <p>{edge.turningPoint}</p>
          <button className="text-link" onClick={() => onTab("News")}>
            News & earnings <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
      <section className="card research-library">
        <div className="section-head">
          <div>
            <h2>Go deeper, when you need to.</h2>
            <p>Every research tool, connected to the same company.</p>
          </div>
        </div>
        <div className="tool-grid">
          {sections
            .filter(
              ([key]) =>
                !evidence.crypto ||
                ["Technicals", "News", "Advanced"].includes(key),
            )
            .map(([key, title, desc]) => (
              <button key={key} onClick={() => onTab(key)}>
                <div>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </div>
                <ArrowUpRight size={18} />
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}
