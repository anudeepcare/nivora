"use client";
import { useState } from "react";
import { ArrowRight, Diamond, Info, ShieldCheck } from "lucide-react";
import {
  PACE_DESCRIPTIONS,
  PACE_EXPLANATION,
  type pacePeriods,
  type pacePresentation,
} from "@/lib/pace-presentation";
import { aurynDecision } from "@/lib/auryn-decision";
import { paceEvidence } from "@/lib/pace-insights";
import { amount, percent } from "@/lib/format";
import type { Research } from "@/lib/types";
import { instrumentReading } from "@/lib/pace-instrument";
import s from "./PaceInstrument.module.css";
const names = [
  "Pause",
  "Watch / hold",
  "Start small",
  "Add gradually",
  "Highest planned accumulation",
];
const short = ["Pause", "Watch", "Start", "Gradual", "Deep"];
type Props = {
  view?: ReturnType<typeof pacePresentation>;
  readings?: ReturnType<typeof pacePeriods>;
  publicGuide?: boolean;
  compact?: boolean;
  onHistory?: () => void;
  research?: Research;
  ownsPosition?: boolean;
  now?: number;
};
export default function PaceInstrument({
  view,
  readings = [],
  publicGuide = false,
  compact = false,
  onHistory,
  research,
  ownsPosition = false,
  now,
}: Props) {
  const [period, setPeriod] = useState<"confirmed" | "forming">("confirmed");
  const [inspect, setInspect] = useState<number | null>(publicGuide ? 2 : null);
  const [help, setHelp] = useState(false);
  const reading = instrumentReading(readings, period),
    selected = inspect ?? reading.level;
  const exploring = publicGuide || inspect !== null;
  const evidence = research
    ? paceEvidence(
        research.history,
        research.priceObservedAt ?? research.retrievedAt,
        period,
        research.company.assetType === "crypto" ? "crypto" : "us-equity",
      )
    : null;
  const decision = research
    ? aurynDecision(research, { ownsPosition, now })
    : null;
  const boundary = evidence?.boundary;
  const businessConflict =
    decision &&
    !["Buy", "Add", "Hold", "Watch", "Wait"].includes(decision.action);
  const valuationConflict = decision?.value === "expensive";
  const currency = research?.quote.currency ?? "USD";
  return (
    <section
      className={`${s.instrument} ${compact ? s.compact : ""}`}
      aria-label={
        publicGuide ? "Explore the AURYN Pace framework" : "AURYN Pace"
      }
    >
      <header className={s.header}>
        <span>
          <img src="/pace-diamond.svg" alt="" width="22" height="24" /> AURYN
          PACE
        </span>
        <button
          type="button"
          aria-label="What does Pace mean?"
          aria-expanded={help}
          onClick={() => setHelp(!help)}
        >
          <Info size={19} />
        </button>
      </header>
      <div className={s.readout}>
        <div className={s.readoutText}>
          <div className={s.title}>
            <small>
              {exploring
                ? "Explore the framework"
                : period === "forming"
                  ? "Completed action · forming price context"
                  : ownsPosition
                    ? "For your holding"
                    : "For new purchases"}
            </small>
            <h2>
              {exploring && selected !== null
                ? names[selected]
                : view?.actionLabel || "Awaiting evidence"}
              <span className={s.level}>
                {selected == null ? "Pending" : `P${selected}`}
              </span>
            </h2>
          </div>
          <div className={s.terraces} aria-label="Five Pace stages">
            {short.map((name, z) => (
              <button
                key={name}
                type="button"
                className={s.stage}
                aria-pressed={selected === z}
                aria-label={`Explore P${z}: ${names[z]}`}
                onClick={() => setInspect(z)}
              >
                <strong>P{z}</strong>
                <span>{name}</span>
                <Diamond
                  size={10}
                  fill={selected === z ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={s.status}>
        <span>
          <Diamond
            size={12}
            fill={period === "forming" ? "none" : "currentColor"}
          />
          {exploring
            ? "Framework · P" + selected
            : reading.level == null
              ? reading.status
              : `P${reading.level} · ${reading.status}`}
        </span>
        {!publicGuide && inspect !== null ? (
          <button onClick={() => setInspect(null)}>
            Back to reading <ArrowRight size={13} />
          </button>
        ) : (
          <small>{publicGuide ? "Tap a step to explore" : reading.date}</small>
        )}
      </div>
      {!exploring && evidence && (
        <div className={s.insight}>
          {boundary && evidence.reading ? (
            <>
              <span className={s.eyebrow}>
                Nearest conditional change · {evidence.reading.month}
              </span>
              <p className={s.boundary}>
                <strong>P{boundary.level}</strong> {boundary.operator}{" "}
                <strong>{amount(boundary.price, currency)}</strong>
              </p>
              <p className={s.distance}>
                {percent(boundary.distancePercent, true)} from the{" "}
                {period === "forming" ? "forming" : "completed"} close ·{" "}
                {evidence.reading.date}
              </p>
            </>
          ) : (
            <p className={s.distance}>
              {period === "forming"
                ? "A current-month reading is not available."
                : "A recent completed monthly reading is not available."}{" "}
              No boundary is assigned.
            </p>
          )}
          {evidence.confirmed && evidence.forming && (
            <p className={s.comparison}>
              Completed <strong>P{evidence.confirmed.multiplier}</strong>
              <ArrowRight size={12} />
              Forming <strong>P{evidence.forming.multiplier}</strong>
              <span>
                {evidence.confirmed.multiplier === evidence.forming.multiplier
                  ? "Aligned for now"
                  : "Not yet confirmed"}
              </span>
            </p>
          )}
        </div>
      )}
      <details className={s.readingDetail}>
        <summary>
          {exploring
            ? "About this stage"
            : "Why this reading · what would change it"}
        </summary>
        <p className={s.description}>
          {exploring && selected !== null
            ? PACE_DESCRIPTIONS[selected]
            : period === "forming"
              ? "The current-period price zone can change. Use the completed period alongside business checks and your position limits."
              : view?.detail ||
                "A completed price reading is needed. Review business evidence in the meantime."}
        </p>
        {!exploring && evidence && (
          <div className={s.evidenceDetails}>
            <p>
              <strong>Why P{evidence.reading?.multiplier ?? "—"}</strong>
              {evidence.reading?.reason.replace(
                "Stronger upsize is capped at 2×",
                "The deeper zone is capped at P2",
              ) ?? evidence.reason}
            </p>
            {boundary && (
              <p>
                <strong>Boundary sensitivity</strong>The nearest zone change is{" "}
                {Math.abs(boundary.distancePercent).toFixed(2)}% from this
                observation. A smaller gap means less price movement could
                change the reading; it is not a probability or a measure of
                business strength.
              </p>
            )}
            <p>
              <strong>
                {period === "forming" ? "Still forming" : "Completed evidence"}
              </strong>
              {period === "forming"
                ? "This month can change before its final settled close. The completed reading continues to govern the action above."
                : "This boundary describes the completed month using only its prior completed months. It is not a live entry target; the current month has its own window."}{" "}
              Boundaries move when the monthly window advances.
            </p>
            {decision && (
              <>
                <p>
                  <strong>
                    {businessConflict
                      ? "Business or evidence gate takes priority"
                      : valuationConflict
                        ? "Price zone and valuation differ"
                        : decision.confidence}
                  </strong>
                  {decision.explanation.detail}
                  {valuationConflict &&
                    " The valuation assessment is demanding even if the business and confirmed Pace permit gradual accumulation. The price zone is not a fair-value estimate."}
                </p>
                <p>
                  <strong>What would change the case</strong>
                  {decision.changeConditions.slice(0, 2).join(" ")}
                </p>
                {decision.risks.length > 0 && (
                  <p>
                    <strong>What could weaken it</strong>
                    {decision.risks[0]}
                  </p>
                )}
                <p>
                  <strong>
                    {ownsPosition ? "Existing holder" : "New buyer"}
                  </strong>
                  {ownsPosition
                    ? decision.actionLabels.holding
                    : decision.actionLabels.entry}
                  .{" "}
                  {ownsPosition
                    ? "A price zone alone does not establish a sell instruction. Review the business case and concentration before changing the holding."
                    : "A forming zone does not qualify a purchase. Keep any completed, business-qualified plan within your cash and position limits."}
                </p>
              </>
            )}
          </div>
        )}
      </details>
      {!publicGuide && (
        <div className={s.periods} aria-label="Pace reading period">
          {(["confirmed", "forming"] as const).map((p) => (
            <button
              key={p}
              aria-pressed={period === p && inspect === null}
              onClick={() => {
                setPeriod(p);
                setInspect(null);
              }}
            >
              {p === "confirmed" ? "Completed period" : "Current · forming"}
            </button>
          ))}
        </div>
      )}
      {help && <p className={s.help}>{PACE_EXPLANATION}</p>}
      <footer className={s.footer}>
        <span>
          <ShieldCheck size={15} />
          {publicGuide
            ? "Price context. Business checks first. Zones are not predicted returns."
            : view?.permitted
              ? "Keep within your cash and position limits"
              : "Business and risk checks take priority"}
        </span>
        {onHistory && (
          <button onClick={onHistory}>
            Evidence & history <ArrowRight size={15} />
          </button>
        )}
      </footer>
    </section>
  );
}
