/** Position within one supplied analyst cohort. No inferred currency or horizon. */
export function analystRangePosition(
  low: unknown,
  mean: unknown,
  high: unknown,
): number | null {
  if (
    ![low, mean, high].every(
      (v) => typeof v === "number" && Number.isFinite(v) && v >= 0,
    )
  )
    return null;
  const l = low as number,
    m = mean as number,
    h = high as number;
  if (l > m || m > h) return null;
  return l === h ? 50 : ((m - l) / (h - l)) * 100;
}
