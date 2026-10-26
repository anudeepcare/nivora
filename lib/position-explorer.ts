/** Hypothetical arithmetic only. It never creates an order or a suggested allocation. */
export function explorePosition(input: {
  portfolioValue: number;
  currentValue: number;
  price: number | null;
  weight: number;
  bearPrice?: number | null;
}) {
  const { portfolioValue, currentValue, price, weight, bearPrice } = input;
  if (
    !Number.isFinite(portfolioValue) ||
    portfolioValue <= 0 ||
    !Number.isFinite(currentValue) ||
    currentValue < 0 ||
    price == null ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(weight) ||
    weight < 0 ||
    weight > 100
  )
    return { available: false as const };
  const targetValue = (portfolioValue * weight) / 100;
  const valueDifference = targetValue - currentValue;
  const scenarioChange =
    bearPrice != null && Number.isFinite(bearPrice) && bearPrice >= 0
      ? Math.round(targetValue * (bearPrice / price - 1) * 100) / 100 || 0
      : null;
  return {
    available: true as const,
    targetValue,
    valueDifference,
    shareDifference: valueDifference / price,
    scenarioChange,
    portfolioImpact:
      scenarioChange == null ? null : (scenarioChange / portfolioValue) * 100,
  };
}

/** A path from supplied observations only: missing history never gets a decorative trend. */
export function pricePath(
  history: { time: string; close: number }[],
  width = 112,
  height = 38,
) {
  const points = [
    ...new Map(
      history
        .filter(
          (p) =>
            Number.isFinite(Date.parse(p.time)) &&
            Number.isFinite(p.close) &&
            p.close > 0,
        )
        .map((p) => [p.time, p]),
    ).values(),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(-63);
  if (
    points.length < 2 ||
    !Number.isFinite(width) ||
    width <= 8 ||
    !Number.isFinite(height) ||
    height <= 8
  )
    return null;
  const lo = Math.min(...points.map((p) => p.close)),
    hi = Math.max(...points.map((p) => p.close));
  const path = points
    .map((p, i) => {
      const x = 3 + (i / (points.length - 1)) * (width - 6);
      const y =
        hi === lo
          ? height / 2
          : 3 + ((hi - p.close) / (hi - lo)) * (height - 6);
      return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return {
    path,
    from: points[0].time,
    through: points.at(-1)!.time,
    direction:
      points.at(-1)!.close > points[0].close
        ? "up"
        : points.at(-1)!.close < points[0].close
          ? "down"
          : "flat",
  };
}
