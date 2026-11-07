import type { OptionContract } from "./options-analysis";
/** Descriptive quote coverage; never infers executable liquidity or trade direction. */
export function optionsLiquidity(contracts: OptionContract[], expiry: string) {
  const unique = new Map<string, OptionContract>();
  for (const c of contracts)
    if (c.expiry === expiry && Number.isFinite(Date.parse(c.observed))) {
      const previous = unique.get(c.id);
      if (!previous || Date.parse(c.observed) > Date.parse(previous.observed))
        unique.set(c.id, c);
    }
  const rows = [...unique.values()];
  const spreads = rows
    .flatMap((c) =>
      c.bid !== null &&
      c.ask !== null &&
      Number.isFinite(c.bid) &&
      Number.isFinite(c.ask) &&
      c.bid > 0 &&
      c.ask >= c.bid
        ? [((c.ask - c.bid) / ((c.ask + c.bid) / 2)) * 100]
        : [],
    )
    .sort((a, b) => a - b);
  const middle = Math.floor(spreads.length / 2);
  return {
    contracts: rows.length,
    twoSided: spreads.length,
    medianSpread: spreads.length
      ? spreads.length % 2
        ? spreads[middle]
        : (spreads[middle - 1] + spreads[middle]) / 2
      : null,
    oldest: rows.length
      ? rows
          .map((c) => c.observed)
          .sort((a, b) => Date.parse(a) - Date.parse(b))[0]
      : null,
    newest: rows.length
      ? rows
          .map((c) => c.observed)
          .sort((a, b) => Date.parse(b) - Date.parse(a))[0]
      : null,
  };
}
