import type { pacePeriods, pacePresentation } from "@/lib/pace-presentation";
import { dateLabel } from "@/lib/format";
import PaceReadings from "./PaceReadings";

/** One actionable treatment on every decision surface. Raw price observations stay in details. */
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
      <div className="pace-action">
        <strong>{view.actionLabel}</strong>
        {view.effectiveCode && (
          <span className="pace-effective">{view.effectiveCode}</span>
        )}
      </div>
      {view.effectiveCode && confirmed?.date && (
        <small>Confirmed · {dateLabel(confirmed.date)}</small>
      )}
      {!compact && <p className="pace-context">{view.detail}</p>}
      {available ? (
        <details className="pace-source-details">
          <summary>Price readings & dates</summary>
          <p>
            Price-only context. Forming readings can change; the completed
            period sets the contribution level.
          </p>
          <PaceReadings readings={readings} compact />
        </details>
      ) : (
        <small className="pace-history-note">
          The contribution level needs more completed price history. Business
          and valuation remain available.
        </small>
      )}
    </div>
  );
}
