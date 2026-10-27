import { dateLabel } from "@/lib/format";
import type { pacePeriods } from "@/lib/pace-presentation";

export default function PaceReadings({
  readings,
  compact = false,
}: {
  readings: ReturnType<typeof pacePeriods>;
  compact?: boolean;
}) {
  return (
    <div className={`pace-readings${compact ? " pace-readings-compact" : ""}`}>
      {readings
        .filter((row) => row.level != null)
        .map((row) => (
          <div
            key={row.key}
            data-pace-level={row.level}
            className={`pace-period pace-period-${row.key}`}
          >
            <span>{row.label}</span>
            <strong>{row.code}</strong>
            <b className="pace-level-name">{row.name}</b>
            <small>
              {row.date ? dateLabel(row.date) : "Building price history"}
            </small>
          </div>
        ))}
    </div>
  );
}
