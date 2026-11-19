/** Price-only comparison, not cash-flow-aware account performance. No date filling. */
export function holdingsBenchmarkOverlay(
  basket: { time: string; value: number }[],
  candles: { time: string; close: number }[],
): { time: string; value: number }[] {
  const validDate = (v: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v;
  if (
    basket.length < 2 ||
    basket.some(
      (p, i) =>
        !validDate(p.time) ||
        !Number.isFinite(p.value) ||
        p.value <= 0 ||
        (i > 0 && p.time <= basket[i - 1].time),
    )
  )
    return [];
  const prices = new Map<string, number>();
  for (const bar of candles) {
    if (
      !validDate(bar.time) ||
      !Number.isFinite(bar.close) ||
      bar.close <= 0 ||
      prices.has(bar.time)
    )
      return [];
    prices.set(bar.time, bar.close);
  }
  if (basket.some((p) => !prices.has(p.time))) return [];
  const first = prices.get(basket[0].time)!;
  const result = basket.map((p) => ({
    time: p.time,
    value: (prices.get(p.time)! / first) * basket[0].value,
  }));
  return result.every((p) => Number.isFinite(p.value)) ? result : [];
}

/** Difference in price changes, in percentage points. Never compares different date ranges. */
export function priceChangeGap(
  holdings: { time: string; value: number }[],
  benchmark: { time: string; value: number }[],
): number | null {
  const a = holdings[0],
    b = holdings.at(-1);
  const c = benchmark[0],
    d = benchmark.at(-1);
  if (
    !a ||
    !b ||
    !c ||
    !d ||
    a.time !== c.time ||
    b.time !== d.time ||
    a.time >= b.time ||
    [a, b, c, d].some(
      (point) => !Number.isFinite(point.value) || point.value <= 0,
    )
  )
    return null;
  const gap =
    ((b.value - a.value) / a.value - (d.value - c.value) / c.value) * 100;
  return Number.isFinite(gap) ? gap : null;
}
