export type PaceMonthReading = {
  month: string;
  date: string;
  multiplier: number;
  close: number;
  reason: string;
  policyVersion?: string;
};
/** Calendar slots do not imply coverage. No forward fill or retroactive model conversion. */
export function paceMonthHistory(
  history: readonly PaceMonthReading[],
  asOf: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(asOf) || !Number.isFinite(Date.parse(asOf)))
    return [];
  const end = new Date(asOf);
  const rows = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 12 + i, 1),
    )
      .toISOString()
      .slice(0, 7);
    const candidates = history.filter((r) => r.month === month);
    const reading = candidates[0];
    const valid =
      reading &&
      /^\d{4}-\d{2}-\d{2}$/.test(reading.date) &&
      Number.isFinite(Date.parse(reading.date)) &&
      new Date(reading.date).toISOString().slice(0, 10) === reading.date &&
      reading.date.slice(0, 7) === month &&
      Number.isInteger(reading.multiplier) &&
      reading.multiplier >= 0 &&
      reading.multiplier <= 4 &&
      Number.isFinite(reading.close) &&
      reading.close > 0 &&
      candidates.every(
        (r) =>
          r.date === reading.date &&
          r.multiplier === reading.multiplier &&
          r.close === reading.close &&
          r.policyVersion === reading.policyVersion,
      );
    return { month, reading: valid ? reading : null };
  });
  return rows;
}
