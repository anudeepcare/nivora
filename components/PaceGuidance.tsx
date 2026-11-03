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
  const confirmed = readings.find((r) => r.key === "confirmed");
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
  const guide = contributionGuide(
    contributionAction,
    view.rawLevel,
  );
  return (
    <div className={`pace-guidance${compact ? " pace-guidance-compact" : ""}`}>
      <div className="pace-action">
        <span className="pace-assessment-label">Your next step</span>
        <strong>{view.actionLabel.replace(/ · P[0-4]$/, "")}</strong>
      </div>
      {!compact && (
        <div className="pace-contribution-guide">
          <span>Contribution guide</span>
          <strong>{guide.multiple > 0 ? guide.label : contributionAction === "Review" ? "Check business evidence" : ["Reduce", "Sell", "Avoid"].includes(contributionAction) ? "New contributions paused" : "Wait before adding"}</strong>
          <small>
            {guide.multiple === 0
              ? "See the assessment for the reason."
              : `${guide.multiple === 4 ? "Up to " : ""}$${100 * guide.multiple} for a usual $100 contribution, within your available cash and position limit.`}
          </small>
        </div>
      )}
      {confirmed?.level != null && (
        <small className="pace-reading-note">Confirmed{confirmed.date ? ` · ${confirmed.date}` : ""} · completed period</small>
      )}
      {!compact && available && (
        <details className="pace-explanation">
          <summary>Why this Pace?</summary>
          <p className="pace-context">{view.detail}</p>
          {confirmed?.reason && <p className="pace-reading-reason">{confirmed.reason}</p>}
          <PaceReadings readings={readings} compact={compact} />
          <small className="pace-reading-note">The developing reading can change. The completed-period reading guides the assessment.</small>
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
