export type InsiderActivityRow = {
  ticker: string;
  companyName: string;
  tradeCount: number;
  insiderCount: number;
  totalShares: number;
  totalValue: number;
  latestDate: string;
  latestInsider: string;
  latestTitle: string;
};
export type MarketInsider = {
  isPreview: boolean;
  days: number;
  receivedAt: string;
  omitted: number;
  buys: InsiderActivityRow[];
  sells: InsiderActivityRow[];
};
const record = (x: unknown): Record<string, unknown> | null =>
  x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
const count = (x: unknown) =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
const text = (x: unknown, max: number) =>
  typeof x === "string" ? x.slice(0, max) : "";
export function marketInsider(
  raw: unknown,
  days: number,
  receivedAt: string,
): MarketInsider | null {
  const envelope = record(raw),
    data = record(envelope?.data);
  if (
    ![30, 90].includes(days) ||
    !Number.isFinite(Date.parse(receivedAt)) ||
    typeof envelope?.isPreview !== "boolean" ||
    !Array.isArray(data?.buys) ||
    !Array.isArray(data?.sells) ||
    data.buys.length + data.sells.length > 10000
  )
    return null;
  const today = receivedAt.slice(0, 10),
    earliest = new Date(Date.parse(`${today}T00:00:00Z`) - days * 86400000)
      .toISOString()
      .slice(0, 10);
  let omitted = 0;
  const project = (rows: unknown[]): InsiderActivityRow[] | null => {
    const seen = new Set<string>(),
      output: InsiderActivityRow[] = [];
    for (const rawRow of rows) {
      const r = record(rawRow),
        date = r?.latestDate;
      if (
        !r ||
        typeof r.ticker !== "string" ||
        !/^[A-Za-z0-9.^_-]{1,24}$/.test(r.ticker) ||
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        date > today ||
        date < earliest ||
        !count(r.tradeCount) ||
        !count(r.insiderCount) ||
        (r.insiderCount as number) > (r.tradeCount as number) ||
        !count(r.totalShares) ||
        typeof r.totalValue !== "number" ||
        !Number.isFinite(r.totalValue) ||
        r.totalValue < 0
      ) {
        omitted++;
        continue;
      }
      const ticker = r.ticker.toUpperCase();
      if (seen.has(ticker)) return null;
      seen.add(ticker);
      output.push({
        ticker,
        companyName: text(r.companyName, 200),
        tradeCount: r.tradeCount as number,
        insiderCount: r.insiderCount as number,
        totalShares: r.totalShares as number,
        totalValue: r.totalValue,
        latestDate: date,
        latestInsider: text(r.latestInsider, 200),
        latestTitle: text(r.latestTitle, 200),
      });
    }
    return output.sort(
      (a, b) => b.totalValue - a.totalValue || a.ticker.localeCompare(b.ticker),
    );
  };
  const buys = project(data.buys),
    sells = project(data.sells);
  if (!buys || !sells) return null;
  return {
    isPreview: envelope.isPreview,
    days,
    receivedAt,
    omitted,
    buys,
    sells,
  };
}
