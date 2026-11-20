"use client";
import { useId, useMemo, useState } from "react";
import { atlasTrends } from "@/lib/atlas-trends";
import type { Research } from "@/lib/types";
import {
  referenceAtlas,
  atlasHorizonLabel,
  type AtlasSignal,
  type AtlasTarget,
} from "@/lib/reference-atlas";
import { amount, percent, dateLabel } from "@/lib/format";
import s from "./ReferenceAtlas.module.css";
import PaceMonthHistory from "./PaceMonthHistory";
const coordinates = [
  [150, 34],
  [255, 89],
  [270, 194],
  [150, 254],
  [36, 194],
  [38, 86],
];
function reading(signal: AtlasSignal, currency: string) {
  if (signal.valueLabel) return signal.valueLabel;
  if (signal.value === null)
    return signal.label === "Value" ? "Unverified" : "—";
  if (signal.unit === "percent") return percent(signal.value);
  if (signal.unit === "money") return amount(signal.value, currency, true);
  return signal.unit === "count"
    ? String(signal.value)
    : signal.value.toFixed(1);
}
export default function ReferenceAtlas({
  research,
  onTab,
}: {
  research: Research;
  onTab: (tab: AtlasTarget) => void;
}) {
  const m = useMemo(() => referenceAtlas(research), [research]);
  const { referenceRange } = m;
  const modeled = m.cases.length === 3;
  const rangeCards = modeled
    ? m.cases.map((item) => ({
        label: item.label,
        tone: item.tone,
        value: amount(item.value, m.outcome.currency),
        caption:
          item.annual == null
            ? "Model value"
            : `${percent(item.annual)} annualized`,
      }))
    : referenceRange
      ? referenceRange.values.map((value, index) => ({
          label: referenceRange.labels[index],
          tone: ["orange", "cyan", "violet"][index],
          value: amount(value, referenceRange.currency),
          caption:
            referenceRange.source === "history"
              ? ["Lower bound", "Historical base", "Upper bound"][index]
              : "Published target",
        }))
      : ["Bear", "Base", "Bull"].map((label) => ({
          label,
          tone: undefined,
          value: "—",
          caption: "Not available",
        }));
  const trends = useMemo(() => atlasTrends(research), [research]);
  const [selected, setSelected] = useState(0);
  const signal = m.signals[selected],
    b = m.brief,
    glow = useId();
  const centerLabel =
    signal.metricLabel ??
    (
      {
        Business: "REV GROWTH",
        Value: "BASE CASE",
        Momentum: "RSI · 14",
        Catalysts: "NEXT EARNINGS",
        Ownership: "OWNER TREND",
        Risk: "RISK",
      } as Record<string, string>
    )[signal.label];
  const centerValue = reading(signal, b.businessNumbers.currency);
  const values = [
    {
      label: "Revenue",
      value: amount(
        b.businessNumbers.revenue,
        b.businessNumbers.currency,
        true,
      ),
      detail: b.period
        ? `Reported ${dateLabel(b.period)}`
        : "Reporting period unavailable",
      target: "Financials" as const,
      tone: "cyan",
    },
    {
      label: "Revenue growth",
      value: percent(b.businessNumbers.revenueGrowth),
      detail: "Comparable reported periods",
      target: "Financials" as const,
      tone: "cyan",
    },
    {
      label: "Free cash flow",
      value: amount(b.businessNumbers.fcf, b.businessNumbers.currency, true),
      detail: "Reported cash after capital spending",
      target: "Financials" as const,
      tone: "violet",
    },
    {
      label: "Operating margin",
      value: percent(b.businessNumbers.operatingMargin),
      detail: "Operating income / revenue",
      target: "Financials" as const,
      tone: "violet",
    },
    {
      label: "Weighted-share change",
      value: percent(b.businessNumbers.dilution),
      detail: "Comparable reported periods; not a price return",
      target: "Financials" as const,
      tone: "violet",
    },
    {
      label: "RSI · 14",
      value: b.timing.rsi == null ? "—" : b.timing.rsi.toFixed(1),
      detail: "Completed daily prices",
      target: "Technicals" as const,
      tone: "orange",
    },
  ];
  return (
    <section className={s.atlas} aria-label="Decision Atlas">
      <div className={s.stage}>
        <section className={s.copy}>
          <span className={s.eyebrow}>Decision Atlas</span>
          <h2>{b.business.title}</h2>
          <p>Select an orbit to inspect the evidence behind this view.</p>
          <div className={s.active} aria-live="polite">
            <small>{signal.label}</small>
            <strong>{reading(signal, b.businessNumbers.currency)}</strong>
            {signal.label === "Value" && signal.value === null ? (
              <p>
                A verified valuation range is not available from the supplied
                inputs. See the evidence checks below; conditional scenarios
                remain separate.
              </p>
            ) : (
              <p>{signal.detail}</p>
            )}
            <button onClick={() => onTab(signal.target)}>
              Explore {signal.label.toLowerCase()}{" "}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
        <section
          className={s.graphic}
          aria-label="Interactive evidence orbit, not a composite score"
        >
          <svg
            viewBox="0 0 300 300"
            role="img"
            aria-label="Six company evidence areas. Use the labeled buttons to inspect each area."
          >
            <defs>
              <radialGradient id={glow}>
                <stop offset="0" stopColor="currentColor" stopOpacity=".18" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="150" cy="145" r="122" fill={`url(#${glow})`} />
            {[35, 68, 102].map((radius) => (
              <circle
                key={radius}
                cx="150"
                cy="145"
                r={radius}
                className={s.ring}
              />
            ))}
            {coordinates.map(([x, y], i) => (
              <line
                key={i}
                x1="150"
                y1="145"
                x2={x}
                y2={y}
                className={s.axis}
              />
            ))}
            {coordinates.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="22"
                className={selected === i ? s.selectedNode : s.node}
              />
            ))}
            <circle cx="150" cy="145" r="38" className={s.core} />
            <text x="150" y="137" textAnchor="middle" className={s.coreLabel}>
              {centerLabel}
            </text>
            <text
              x="150"
              y="157"
              textAnchor="middle"
              className={s.coreValue}
              style={centerValue.length > 8 ? { fontSize: 10 } : undefined}
            >
              {centerValue}
            </text>
          </svg>
          <div
            className={s.orbitButtons}
            role="group"
            aria-label="Select evidence orbit"
          >
            {m.signals.map((item, i) => (
              <button
                key={item.label}
                className={s[`orbit${i}`]}
                aria-pressed={selected === i}
                aria-label={`${item.label}: ${item.value === null && !item.valueLabel ? "review evidence" : reading(item, b.businessNumbers.currency)}`}
                onClick={() => setSelected(i)}
              >
                <span>{reading(item, b.businessNumbers.currency)}</span>
                <small>{item.metricLabel ?? item.label}</small>
              </button>
            ))}
          </div>
          <p className={s.graphicNote}>Evidence map · not a synthetic score</p>
        </section>
        <aside className={s.action} aria-label="Pace and decision conditions">
          <span className={s.eyebrow}>
            {m.paceState === "forming"
              ? "Current forming Pace"
              : "Last completed Pace"}
          </span>
          <strong>{m.pace === null ? "—" : `P${m.pace}`}</strong>
          <h3>
            {m.pace === null
              ? "More history needed"
              : m.pace === 0
                ? "Pause condition"
                : m.pace === 1
                  ? "Watch / hold condition"
                  : "Review planned accumulation"}
          </h3>
          <p>{m.paceReason}</p>
          <dl>
            <div>
              <dt>
                {m.paceState === "forming"
                  ? "Provisional · can change"
                  : "Completed interval"}
              </dt>
              <dd>
                {m.paceState} ·{" "}
                {m.paceDate ? dateLabel(m.paceDate) : "unavailable"}
              </dd>
            </div>
            {m.paceState === "forming" && (
              <div>
                <dt>Last completed Pace</dt>
                <dd>
                  {b.accumulation.multiplier == null
                    ? "Unavailable"
                    : `P${b.accumulation.multiplier}`}{" "}
                  ·{" "}
                  {b.accumulation.date
                    ? dateLabel(b.accumulation.date)
                    : "Date unavailable"}
                </dd>
              </div>
            )}
            <div>
              <dt>Key risk</dt>
              <dd>{b.risk}</dd>
            </div>
          </dl>
          <button onClick={() => onTab("Pace")}>
            Open Pace evidence <span aria-hidden="true">↗</span>
          </button>
          <small>
            Independent model condition, not an order or personal
            recommendation.{" "}
            {m.paceState === "forming" ? "Current month can change." : ""}
          </small>
        </aside>
      </div>
      <div className={s.lower}>
        <section className={s.scenarios}>
          <header>
            <span className={s.eyebrow}>
              {referenceRange?.title ??
                (modeled ? "Modeled range" : "Outcome range")}{" "}
              {atlasHorizonLabel(m.horizon)
                ? `· ${atlasHorizonLabel(m.horizon)}`
                : ""}
            </span>
            <button onClick={() => onTab("Valuation")}>
              {modeled ? "Open model" : "Open Scenarios"} ↗
            </button>
          </header>
          <div className={s.caseGrid}>
            {rangeCards.map((card) => (
              <button
                key={card.label}
                data-tone={card.tone}
                onClick={() => onTab("Valuation")}
              >
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.caption}</small>
              </button>
            ))}
          </div>
          {modeled ? (
            <p>
              {m.outcome.method} · {m.outcome.caveat}
              {m.outcome.asOf && <> Model dated {dateLabel(m.outcome.asOf)}.</>}
              {m.outcome.end && <> Ends {dateLabel(m.outcome.end)}.</>}
            </p>
          ) : referenceRange ? (
            <p>
              {referenceRange.note}
              {referenceRange.asOf && (
                <>
                  {" "}
                  {referenceRange.source === "history"
                    ? "Reference price dated"
                    : "Observed"}{" "}
                  {dateLabel(referenceRange.asOf)}.
                </>
              )}
            </p>
          ) : (
            <p>{m.outcome.caveat}</p>
          )}
        </section>
        <section className={s.evidence}>
          <header>
            <span className={s.eyebrow}>Evidence checks</span>
            <span>Input availability · not confidence</span>
          </header>
          {b.checks.map((check) => (
            <details className={s.evidenceCheck} key={check.label}>
              <summary>
                <span>{check.label}</span>
                <strong data-state={check.status}>{check.status}</strong>
              </summary>
              <p>{check.detail}</p>
            </details>
          ))}
        </section>
      </div>
      <h3 className={s.metricsHeading}>Business & timing metrics</h3>
      <section className={s.tape} aria-label="Company metric tape">
        {values.map((item) => (
          <button
            key={item.label}
            data-tone={item.tone}
            onClick={() => onTab(item.target)}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
            {trends[item.label] && (
              <>
                <svg
                  className={s.metricTrend}
                  viewBox="0 0 200 48"
                  role="img"
                  aria-label={`${item.label}: ${trends[item.label]!.observations}`}
                >
                  <title>{trends[item.label]!.observations}</title>
                  <polyline
                    points={trends[item.label]!.points}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <small>
                  {trends[item.label]!.basis} · {trends[item.label]!.from}–
                  {trends[item.label]!.to}
                </small>
              </>
            )}
          </button>
        ))}
      </section>
      <PaceMonthHistory key={research.company.symbol} research={research} />
    </section>
  );
}
