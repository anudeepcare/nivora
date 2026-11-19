/** A stable, zero-based comparison scale using round percentage increments. */
export function portfolioPercentScale(low: number, high: number) {
  const min = Math.min(0, low);
  const max = Math.max(0, high);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return { min: -1, max: 1, ticks: [-1, 0, 1] };
  }
  const rough = Math.max(0.1, (max - min) / 4);
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((n) => n * power >= rough) ?? 10) * power;
  const lowIndex = Math.floor(min / step);
  const highIndex = Math.ceil(max / step);
  const tick = (n: number) => Number((n * step).toPrecision(12));
  return {
    min: tick(lowIndex),
    max: tick(highIndex),
    ticks: Array.from({ length: highIndex - lowIndex + 1 }, (_, i) =>
      tick(lowIndex + i),
    ),
  };
}
