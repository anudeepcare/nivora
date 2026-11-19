import type { pacePeriods, pacePresentation } from "@/lib/pace-presentation";
import PaceReadings from "./PaceReadings";
import { contributionGuide } from "@/lib/pace-presentation";

/** Pace stays visible; the overall assessment explains whether additions are supported. */
export default function PaceGuidance({
  view,
  readings,
  compact = false,
}: {
  view: ReturnType<typeof pacePresentation>;
  readings: ReturnType<typeof pacePeriods>;
  compact?: boolean;
}) {
  const confirmed = readings.find((r) => r.key === "forming");
  const available = readings.some((r) => r.level != null);
  const contributionAction = view.permitted
    ? view.actionLabel.startsWith("Add")
      ? "Add"
      : "Buy"
    : view.actionLabel.startsWith("Review")
      ? "Review"
      : view.actionLabel === "Reduce"
        ? "Reduce"
        : view.actionLabel === "Sell"
          ? "Sell"
          : view.actionLabel === "Avoid"
            ? "Avoid"
            : view.actionLabel === "Watch"
              ? "Watch"
              : view.actionLabel.startsWith("Hold")
                ? "Hold"
                : "Wait";
  const guide = contributionGuide(contributionAction, view.eligibleLevel);
  return (
    <div className={`pace-guidance${compact ? " pace-guidance-compact" : ""}`}>
      <div className="pace-action">
        <span className="pace-assessment-label">Your next step</span>
        <strong>{view.actionLabel.replace(/ · P[0-4]$/, "")}</strong>
      </div>
      {!compact && confirmed?.level != null && (
        <div
          className="signal-pace-scale"
          aria-label={`Current provisional Pace P${confirmed.level}; P means Pace`}
        >
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              data-active={confirmed.level === level ? "true" : undefined}
              title={
                [
                  "Pause additions",
                  "Watch or hold",
                  "Start small",
                  "Build gradually",
                  "Deep accumulation zone",
                ][level]
              }
            >
              P{level}
            </span>
          ))}
        </div>
      )}
      {!compact && (
        <div className="pace-contribution-guide">
          <span>Contribution guide</span>
          <strong>
            {guide.multiple > 0
              ? guide.label
              : contributionAction === "Review"
                ? "Check business evidence"
                : ["Reduce", "Sell", "Avoid"].includes(contributionAction)
                  ? "New contributions paused"
                  : "Wait before adding"}
          </strong>
          <small>
            {guide.multiple === 0
              ? "See the assessment for the reason."
              : `${guide.multiple === 4 ? "Up to " : ""}$${100 * guide.multiple} for a usual $100 contribution, within your available cash and position limit.`}
          </small>
        </div>
      )}
      {confirmed?.level != null && (
        <small className="pace-reading-note">
          Current{confirmed.date ? ` · ${confirmed.date}` : ""} · provisional
        </small>
      )}
      {!compact && available && (
        <details className="pace-explanation">
          <summary>Why this Pace?</summary>
          <p className="pace-context">{view.detail}</p>
          {confirmed?.reason && (
            <p className="pace-reading-reason">{confirmed.reason}</p>
          )}
          <PaceReadings readings={readings} compact={compact} />
          <small className="pace-reading-note">
            The current zone may change. Historical zones remain evidence; they
            cannot authorize additions after the current zone weakens.
          </small>
        </details>
      )}
      {!available && (
        <small className="pace-history-note">
          The accumulation zone needs more completed price history. Business and
          valuation remain available.
        </small>
      )}
    </div>
  );
}
