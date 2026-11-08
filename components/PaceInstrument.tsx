"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Diamond } from "lucide-react";
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
  const action =
    decision?.actionLabel ?? view?.actionLabel ?? "Review evidence";
  const actionText =
    action === "Watch"
      ? "Wait for an entry"
      : action === "Hold"
        ? "Hold existing position"
        : action;
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
          <span>AURYN PACE</span>
        </span>
        <PaceHelp />
      </header>
      <div className={s.readout}>
        <div className={s.readoutText}>
          <div className={s.title}>
            <small>
              {exploring ? "Explore the framework" : "Accumulation pace"}
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
              ? "Provisional · this month"
              : level === null
                ? "Current history unavailable"
                : "Month-end reading"}
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
          <p className={s.action}>{actionText}</p>
          {boundary && (
            <p className={s.boundary}>
              <span>Next zone</span>
              <strong>
                P{boundary.level} {boundary.operator}{" "}
                {amount(boundary.price, currency)}
              </strong>
              <small>
                {percent(boundary.distancePercent, true)} · conditional
              </small>
            </p>
          )}
        </div>
      )}
      <details className={s.readingDetail}>
        <summary>{exploring ? "About this stage" : "Levels & history"}</summary>
        <p className={s.description}>
          {exploring && selected !== null
            ? PACE_DESCRIPTIONS[selected]
            : (evidence?.reading?.reason ??
              "Refresh price history to calculate the current zone.")}
        </p>
        {!exploring && (
          <div className={s.evidenceDetails}>
            {current?.historicalLevel != null && (
              <p>
                <strong>Previous month · P{current.historicalLevel}</strong>
                {dateLabel(current.historicalDate)} · historical reading
              </p>
            )}
            {decision && (
              <p>
                <strong>What to review</strong>
                {decision.changeConditions[0] ?? decision.explanation.detail}
              </p>
            )}
            {onHistory && (
              <button type="button" onClick={onHistory}>
                Open technicals & history <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </details>
    </section>
  );
}
