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
import PacePriceZones from "./PacePriceZones";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
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
      ? "Watch for an entry"
      : action === "Hold"
        ? "Hold existing position"
        : action;
  const currency = research?.quote.currency ?? "USD";
  return (
    <section
      className={`${s.instrument} ${compact ? s.compact : ""}`}
      data-tone={decision?.tone ?? "neutral"}
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
        <PaceHelp
          research={research}
          asOf={
            research
              ? new Date(
                  now ??
                    Date.parse(
                      research.priceObservedAt ?? research.retrievedAt,
                    ),
                ).toISOString()
              : undefined
          }
        />
      </header>
      <div className={s.readout}>
        <div className={s.readoutText}>
          <div className={s.title}>
            <small>
              {exploring
                ? "Explore the framework"
                : (decision?.contextLabel ?? "Current decision")}
            </small>
            <h2>
              {exploring && selected !== null
                ? PACE_LEVELS[selected]
                : actionText}
            </h2>
            {!exploring && decision?.headline && (
              <p className={s.reason}>{decision.headline}</p>
            )}
            <p className={s.zoneContext}>
              {selected === null
                ? "Price history needed"
                : `P${selected} · ${PACE_LEVELS[selected]}`}
            </p>
          </div>
          {!exploring && (
            <div className={s.insight}>
              {boundary && (
                <p className={s.boundary}>
                  <span>Next price checkpoint</span>
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
          {research ? (
            <PacePriceZones
              research={research}
              asOf={new Date(
                now ??
                  Date.parse(research.priceObservedAt ?? research.retrievedAt),
              ).toISOString()}
              period={current?.provisional ? "forming" : "confirmed"}
              compact
              selected={selected}
              onInspect={setInspect}
            />
          ) : (
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
          )}
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
      <details
        className={s.readingDetail}
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
      >
        <summary>
          {exploring ? "About this stage" : "Price zones & history"}
        </summary>
        {!exploring && research && (
          <PacePriceZones
            research={research}
            asOf={new Date(
              now ??
                Date.parse(research.priceObservedAt ?? research.retrievedAt),
            ).toISOString()}
            period={period}
            active={detailsOpen}
          />
        )}
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
