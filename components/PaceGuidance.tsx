import type { pacePeriods, pacePresentation } from "@/lib/pace-presentation";
import PaceReadings from "./PaceReadings";

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
  return (
    <div className={`pace-guidance${compact ? " pace-guidance-compact" : ""}`}>
      {available && <PaceReadings readings={readings} compact={compact} />}
      {available && !compact && (
        <small className="pace-reading-note">
          Accumulation pace · forming can change; confirmed uses the completed
          period.
        </small>
      )}
      {!compact && confirmed?.level != null && confirmed.reason && (
        <p className="pace-reading-reason">
          <b>Why {confirmed.code} confirmed</b>
          {confirmed.reason}
        </p>
      )}
      <div className="pace-action">
        <span className="pace-assessment-label">Contribution plan</span>
        <strong>{view.actionLabel}</strong>
        {view.effectiveCode && (
          <span className="pace-effective">{view.effectiveCode}</span>
        )}
      </div>
      {!compact && <p className="pace-context">{view.detail}</p>}
      {!available && (
        <small className="pace-history-note">
          The contribution level needs more completed price history. Business
          and valuation remain available.
        </small>
      )}
    </div>
  );
}
