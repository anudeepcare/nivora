"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Diamond, ShieldCheck } from "lucide-react";
import {
  PACE_DESCRIPTIONS,
  PACE_LEVELS,
  type pacePeriods,
  type pacePresentation,
} from "@/lib/pace-presentation";
import { aurynDecision } from "@/lib/auryn-decision";
import { paceEvidence } from "@/lib/pace-insights";
import { amount, percent, dateLabel } from "@/lib/format";
import type { Research } from "@/lib/types";
import s from "./PaceInstrument.module.css";
import PaceHelp from "./PaceHelp";
const short = ["Pause", "Watch", "Start", "Gradual", "Planned max"];
type Props = {
  view?: ReturnType<typeof pacePresentation>;
  readings?: ReturnType<typeof pacePeriods>;
  decision?: ReturnType<typeof aurynDecision>;
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
  decision: supplied,
  publicGuide = false,
  compact = false,
  onHistory,
  research,
  ownsPosition = false,
  now,
}: Props) {
  const [inspect, setInspect] = useState<number | null>(publicGuide ? 2 : null);
  const decision = useMemo(
    () =>
      supplied ??
      (research ? aurynDecision(research, { ownsPosition, now }) : null),
    [supplied, research, ownsPosition, now],
  );
  const current = decision?.pace;
  const fallback = readings.find((r) => r.key === "forming");
  const level = current ? current.level : (fallback?.level ?? null);
  const selected = inspect ?? level;
  const exploring = publicGuide || inspect !== null;
  const period = current?.provisional === false ? "confirmed" : "forming";
  const evidence = useMemo(
    () =>
      research
        ? paceEvidence(
            research.history,
            new Date(
              now ??
                Date.parse(research.priceObservedAt ?? research.retrievedAt),
            ).toISOString(),
            period,
            research.company.assetType === "crypto" ? "crypto" : "us-equity",
          )
        : null,
    [research, now, period],
  );
  const boundary = level !== null ? evidence?.boundary : null;
  const currency = research?.quote.currency ?? "USD";
  return (
    <section
      className={`${s.instrument} ${compact ? s.compact : ""}`}
      aria-label={
        publicGuide
          ? "Explore the AURYN Accumulation Pace framework"
          : "Current AURYN price zone"
      }
    >
      <header className={s.header}>
        <span>
          <img src="/pace-diamond.svg" alt="" width="22" height="24" />
          <span>
            AURYN
            <br />
            ACCUMULATION PACE
          </span>
        </span>
        <PaceHelp />
      </header>
      <div className={s.readout}>
        <div className={s.readoutText}>
          <div className={s.title}>
            <small>
              {exploring ? "Explore the framework" : "Current price zone"}
            </small>
            <h2>
              {selected === null
                ? "Refresh price history"
                : PACE_LEVELS[selected]}
              <span className={s.level}>
                {selected === null ? "Pending" : `P${selected}`}
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
                aria-label={`Explore P${z}: ${name}`}
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
          <Diamond size={12} fill="none" />
          {exploring
            ? `Framework · P${selected}`
            : current?.provisional
              ? "Provisional · may change before month-end"
              : level === null
                ? "Current history unavailable"
                : "Latest closing observation"}
        </span>
        {!publicGuide && inspect !== null ? (
          <button onClick={() => setInspect(null)}>
            Back to current zone <ArrowRight size={13} />
          </button>
        ) : (
          <small>
            {publicGuide
              ? "Tap a step to explore"
              : dateLabel(current?.date ?? fallback?.date)}
          </small>
        )}
      </div>
      {!exploring && (
        <div className={s.insight}>
          <span className={s.eyebrow}>Assessment after business checks</span>
          <p className={s.boundary}>
            {decision?.actionLabel ?? view?.actionLabel ?? "Review evidence"}
          </p>
          {current?.changed && (
            <p className={s.distance}>
              The previous closing zone was P{current.historicalLevel}; the
              current zone is P{current.level}.{" "}
              {current.level! < current.historicalLevel!
                ? "The previous zone does not authorize additions now."
                : "A deeper provisional zone does not increase the established contribution guide."}
            </p>
          )}
          {boundary && (
            <>
              <span className={s.eyebrow}>
                What would change the price zone?
              </span>
              <p className={s.boundary}>
                <strong>P{boundary.level}</strong> {boundary.operator}{" "}
                <strong>{amount(boundary.price, currency)}</strong>
              </p>
              <p className={s.distance}>
                {percent(boundary.distancePercent, true)} from the latest
                eligible close · conditional on this month's inputs
              </p>
            </>
          )}
        </div>
      )}
      <details className={s.readingDetail}>
        <summary>
          {exploring ? "About this stage" : "Why this zone & what to watch"}
        </summary>
        <p className={s.description}>
          {exploring && selected !== null
            ? PACE_DESCRIPTIONS[selected]
            : (evidence?.reading?.reason ??
              "Recent settled price history is needed. A previous month’s reading is not current guidance.")}
        </p>
        {!exploring && (
          <div className={s.evidenceDetails}>
            <p>
              <strong>How to read it</strong>This is price context, not a
              business-quality score or a forecast. The current zone uses
              eligible settled prices and may change before month-end. A new
              quote can update portfolio values without changing this zone.
            </p>
            {decision && (
              <>
                <p>
                  <strong>Business and valuation</strong>
                  {decision.explanation.detail}
                </p>
                <p>
                  <strong>What would change the assessment</strong>
                  {decision.changeConditions.slice(0, 2).join(" ")}
                </p>
              </>
            )}
          </div>
        )}
      </details>
      {!publicGuide && (
        <details className={s.readingDetail}>
          <summary>Previous month’s closing zone · history</summary>
          <p className={s.description}>
            {current?.historicalLevel != null
              ? `P${current.historicalLevel} · ${dateLabel(current.historicalDate)}. Historical evidence, not today’s purchase instruction.`
              : "No previous monthly closing zone is available."}
          </p>
        </details>
      )}
      <footer className={s.footer}>
        <span>
          <ShieldCheck size={15} />
          Business checks and portfolio limits come first
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
