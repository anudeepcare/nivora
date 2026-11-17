/** Plot actual percentage-point metrics, never synthetic business scores. */
export function discoveryPlot(
  rows: {
    symbol: string;
    growth: number | null;
    cash: number | null;
    revenue: number | null;
    pace: string;
  }[],
) {
  const valid = rows
    .flatMap((r) =>
      r.growth != null &&
      Number.isFinite(r.growth) &&
      r.cash != null &&
      Number.isFinite(r.cash) &&
      r.revenue != null &&
      Number.isFinite(r.revenue) &&
      r.revenue > 0
        ? [{ ...r, margin: (r.cash / r.revenue) * 100 }]
        : [],
    )
    .filter((r) => Number.isFinite(r.margin));
  const extent = (v: number[]) => {
    const lo = Math.min(0, ...v),
      hi = Math.max(0, ...v);
    return lo === hi ? [lo - 1, hi + 1] : [lo, hi];
  };
  const x = extent(valid.map((r) => r.growth!)),
    y = extent(valid.map((r) => r.margin));
  return {
    x,
    y,
    omitted: rows.length - valid.length,
    points: valid.map((r) => ({
      ...r,
      x: 10 + (80 * (r.growth! - x[0])) / (x[1] - x[0]),
      y: 85 - (70 * (r.margin - y[0])) / (y[1] - y[0]),
    })),
  };
}
