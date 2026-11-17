export const optionObservationMetrics = {
  atmIv: { label: "ATM implied volatility", unit: "%", scale: 100 },
  pcVol: { label: "Put / call volume", unit: "×", scale: 1 },
  callVol: { label: "Calls traded", unit: "contracts", scale: 1 },
  putVol: { label: "Puts traded", unit: "contracts", scale: 1 },
} as const;
export type OptionObservationMetric = keyof typeof optionObservationMetrics;
export function optionObservations(
  value: unknown,
  intraday: boolean,
  metric: OptionObservationMetric,
) {
  const data =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const input = Array.isArray(data.series) ? data.series : [];
  const observations = input
    .flatMap((v) => {
      if (!v || typeof v !== "object") return [];
      const r = v as Record<string, unknown>;
      const date =
        typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date)
          ? r.date
          : null;
      const timestamp = intraday
        ? typeof r.asOf === "number"
          ? r.asOf * 1000
          : NaN
        : date
          ? Date.parse(date)
          : NaN;
      if (
        !Number.isFinite(timestamp) ||
        timestamp <= 0 ||
        timestamp >= 8.64e15 ||
        (!intraday && new Date(timestamp).toISOString().slice(0, 10) !== date)
      )
        return [];
      const raw = r[metric];
      const value =
        typeof raw === "number" && Number.isFinite(raw) && raw >= 0
          ? raw * optionObservationMetrics[metric].scale
          : null;
      return [
        {
          timestamp,
          value,
          label: intraday
            ? new Date(timestamp).toISOString().slice(0, 16).replace("T", " ") +
              " UTC"
            : date!,
        },
      ];
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  // Duplicate timestamps are ambiguous; do not choose a preferred observation silently.
  const counts = new Map<number, number>();
  for (const p of observations)
    counts.set(p.timestamp, (counts.get(p.timestamp) ?? 0) + 1);
  const unique = observations.filter((p) => counts.get(p.timestamp) === 1);
  return {
    points: unique.filter(
      (p): p is typeof p & { value: number } => p.value !== null,
    ),
    missing: input.length - unique.filter((p) => p.value !== null).length,
  };
}
