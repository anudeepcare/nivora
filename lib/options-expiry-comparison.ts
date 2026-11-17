import type { OptionContract } from "./options-analysis";
const validDay = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
const count = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
/** Returned contracts only. Missing volume is not zero; mixed observations remain visible. */
export function expiryComparison(input: OptionContract[]) {
  const latest = new Map<string, OptionContract>();
  for (const c of input) {
    if (
      !c.standard ||
      c.multiplier !== 100 ||
      !validDay(c.expiry) ||
      !Number.isFinite(Date.parse(c.observed))
    )
      continue;
    const old = latest.get(c.id);
    if (!old || Date.parse(c.observed) >= Date.parse(old.observed))
      latest.set(c.id, c);
  }
  const groups = new Map<string, OptionContract[]>();
  for (const c of latest.values())
    groups.set(c.expiry, [...(groups.get(c.expiry) ?? []), c]);
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([expiry, rows]) => {
      const sum = (list: OptionContract[], key: "oi" | "volume") =>
        list.length && list.every((c) => count(c[key]))
          ? list.reduce((s, c) => s + c[key]!, 0)
          : null;
      const observed = rows.map((c) => c.observed).sort();
      return {
        expiry,
        contracts: rows.length,
        callVolume: sum(
          rows.filter((c) => c.type === "call"),
          "volume",
        ),
        putVolume: sum(
          rows.filter((c) => c.type === "put"),
          "volume",
        ),
        oi: sum(rows, "oi"),
        volumeCoverage: rows.filter((c) => count(c.volume)).length,
        oldest: observed[0],
        newest: observed.at(-1)!,
      };
    });
}
