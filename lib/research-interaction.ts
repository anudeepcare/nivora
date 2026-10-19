export function researchTabTarget(
  saved: number | undefined,
  current: number,
  anchor: number,
  header: number,
) {
  if (saved != null && Number.isFinite(saved)) return Math.max(0, saved);
  return Math.max(
    0,
    Math.min(
      Number.isFinite(current) ? current : 0,
      Number.isFinite(anchor) && Number.isFinite(header) ? anchor - header : 0,
    ),
  );
}
