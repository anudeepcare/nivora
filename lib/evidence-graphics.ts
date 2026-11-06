export type EvidencePoint = { label: string; value: number | null | undefined };
/** Coordinates only: missing samples are omitted, never imputed. Bars include zero. */
export function seriesGeometry(rows: EvidencePoint[], kind: "bar" | "line") {
  const valid = rows.filter(
    (r): r is { label: string; value: number } =>
      typeof r.value === "number" && Number.isFinite(r.value),
  );
  if (!valid.length) return null;
  let low = Math.min(...valid.map((r) => r.value)),
    high = Math.max(...valid.map((r) => r.value));
  if (kind === "bar") {
    low = Math.min(0, low);
    high = Math.max(0, high);
  }
  if (low === high) {
    const spread = Math.max(1, Math.abs(low) * 0.1);
    low -= spread;
    high += spread;
  }
  const y = (v: number) => 72 - ((v - low) / (high - low)) * 62;
  const points = valid.map((r, i) => ({
    ...r,
    x: valid.length === 1 ? 120 : 18 + i * (204 / (valid.length - 1)),
    y: y(r.value),
  }));
  return { points, zero: y(0), low, high };
}
export function overviewValueMessage(value: string, baseChange: number | null) {
  if (value === "unestablished") return "Assumptions need review";
  if (value === "supported" && baseChange != null)
    return "Conditional price cushion";
  if (value === "demanding") return "Price asks more of the business";
  return "Put the price in perspective";
}
