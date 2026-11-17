import type { OptionContract } from "./options-analysis";
import type { Candle } from "./types";
export function rankContracts(rows: OptionContract[], sort: string) {
  const score = (c: OptionContract) => {
    if (sort === "ratio")
      return c.volume !== null &&
        c.oi !== null &&
        c.oi > 0 &&
        Number.isFinite(c.volume)
        ? c.volume / c.oi
        : -Infinity;
    if (sort === "oi") return c.oi ?? -Infinity;
    if (sort === "volume") return c.volume ?? -Infinity;
    return -c.strike;
  };
  return [...rows].sort(
    (a, b) =>
      score(b) - score(a) || a.strike - b.strike || a.id.localeCompare(b.id),
  );
}
export function volatilityContext(
  contracts: OptionContract[],
  history: Candle[],
  spot: number,
  asOf = new Date().toISOString(),
) {
  const term = [...new Set(contracts.map((c) => c.expiry))]
    .sort()
    .flatMap((expiry) => {
      const rows = contracts.filter(
        (c) =>
          c.expiry === expiry &&
          c.standard &&
          c.iv !== null &&
          Number.isFinite(c.iv) &&
          c.iv > 0 &&
          Number.isFinite(c.strike),
      );
      const strike = rows.reduce<number | null>(
        (v, c) =>
          v === null || Math.abs(c.strike - spot) < Math.abs(v - spot)
            ? c.strike
            : v,
        null,
      );
      const near = rows.filter((c) => c.strike === strike);
      if (!near.length || new Set(near.map((c) => c.observed)).size !== 1)
        return [];
      return [
        {
          expiry,
          strike: strike!,
          iv: near.reduce((s, c) => s + c.iv!, 0) / near.length,
          observed: near[0].observed,
        },
      ];
    });
  const dated = [
    ...new Map(
      history
        .filter(
          (c) =>
            /^\d{4}-\d{2}-\d{2}$/.test(c.time) &&
            c.time < asOf.slice(0, 10) &&
            Number.isFinite(c.close) &&
            c.close > 0,
        )
        .map((c) => [c.time, c]),
    ).values(),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(-21);
  const returns = dated
    .slice(1)
    .map((c, i) => Math.log(c.close / dated[i].close));
  const consecutive = dated.every(
    (c, i) =>
      !i || Date.parse(c.time) - Date.parse(dated[i - 1].time) <= 7 * 86400000,
  );
  const mean = returns.reduce((s, n) => s + n, 0) / Math.max(1, returns.length);
  const realized =
    returns.length === 20 &&
    consecutive &&
    Date.parse(dated.at(-1)!.time) - Date.parse(dated[0].time) <= 35 * 86400000
      ? Math.sqrt(
          (returns.reduce((s, n) => s + (n - mean) ** 2, 0) /
            (returns.length - 1)) *
            252,
        )
      : null;
  return {
    term,
    realized,
    realizedThrough: realized === null ? null : dated.at(-1)!.time,
  };
}
