/** Presentation only: never infer a completed reading from the developing period. */
export function instrumentReading(
  readings: readonly {
    key: string;
    level?: number | null;
    date?: string | null;
  }[],
  period = "confirmed",
) {
  const reading = readings.find((r) => r.key === period);
  const n = reading?.level;
  const level =
    typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 4 ? n : null;
  return {
    level,
    date: reading?.date ?? null,
    status:
      level == null
        ? "History pending"
        : period === "forming"
          ? "Forming"
          : "Confirmed",
  };
}
