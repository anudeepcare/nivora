/** Whole-window adjusted-close ratios only: never splice differently adjusted snapshots.
 * Contract: https://eodhd.com/financial-apis/api-for-historical-data-and-volumes
 * This is a hypothetical close-execution policy, not account TWR or an index return.
 */
export type BenchmarkPoint = { date: string; value: number };
export type BenchmarkResult = {
  symbol: "SPY" | "QQQ";
  status: "available" | "unavailable";
  reason: string;
  points: BenchmarkPoint[];
  source: "EODHD";
  basis: "split-dividend-adjusted";
};
class BenchmarkEvidenceError extends Error {}
type Flow = { date: string; type: string; amount: number };
type Reader = (
  path: string,
  params: Record<string, string>,
  ttl: number,
) => Promise<unknown>;
const day = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function matchedBenchmark(
  rows: Flow[],
  dates: string[],
  raw: unknown,
): BenchmarkPoint[] {
  if (
    !dates.length ||
    dates.length > 366 ||
    dates.some((d, i) => !day(d) || (i > 0 && d <= dates[i - 1]))
  )
    throw new BenchmarkEvidenceError("Invalid benchmark valuation dates.");
  if (!Array.isArray(raw))
    throw new BenchmarkEvidenceError("Adjusted benchmark history unavailable.");
  const prices = new Map<string, number>();
  for (const r of raw) {
    if (
      !r ||
      !day(r.date) ||
      typeof r.adjusted_close !== "number" ||
      !Number.isFinite(r.adjusted_close) ||
      r.adjusted_close <= 0 ||
      prices.has(r.date)
    )
      throw new BenchmarkEvidenceError(
        "Invalid or duplicate adjusted benchmark evidence.",
      );
    prices.set(r.date, r.adjusted_close);
  }
  const flows = new Map<string, number>();
  for (const r of rows.filter(
    (r) => r.type === "deposit" || r.type === "withdrawal",
  )) {
    if (
      !day(r.date) ||
      r.date > dates.at(-1)! ||
      !Number.isFinite(r.amount) ||
      r.amount < 0
    )
      throw new BenchmarkEvidenceError("Invalid external benchmark cash flow.");
    if (!prices.has(r.date))
      throw new BenchmarkEvidenceError(
        `No exact benchmark close for cash flow on ${r.date}. Weekend, holiday and missing-price flows are not shifted.`,
      );
    flows.set(
      r.date,
      (flows.get(r.date) ?? 0) + (r.type === "deposit" ? r.amount : -r.amount),
    );
  }
  for (const d of dates)
    if (!prices.has(d))
      throw new BenchmarkEvidenceError(
        `Missing benchmark close on ${d}; comparison withheld.`,
      );
  let units = 0;
  const result: BenchmarkPoint[] = [];
  const valuationDates = new Set(dates);
  for (const date of [...new Set([...dates, ...flows.keys()])].sort()) {
    const price = prices.get(date)!;
    const wealth = units * price + (flows.get(date) ?? 0);
    if (!Number.isFinite(wealth) || wealth < -0.000001)
      throw new BenchmarkEvidenceError(
        `Benchmark cannot fund the withdrawal on ${date} without borrowing.`,
      );
    units = Math.max(0, wealth) / price;
    if (!Number.isFinite(units))
      throw new BenchmarkEvidenceError("Benchmark calculation overflow.");
    if (valuationDates.has(date))
      result.push({ date, value: Math.max(0, wealth) });
  }
  return result;
}
export async function accountBenchmarks(
  rows: Flow[],
  dates: string[],
  from: string,
  through: string,
  read: Reader,
): Promise<BenchmarkResult[]> {
  return Promise.all(
    (["SPY", "QQQ"] as const).map(async (symbol) => {
      const base = {
        symbol,
        source: "EODHD" as const,
        basis: "split-dividend-adjusted" as const,
      };
      try {
        const identity = (await read(
          `fundamentals/${symbol}.US`,
          { filter: "General" },
          86400000,
        )) as Record<string, unknown>;
        if (
          identity?.Code !== symbol ||
          identity.CurrencyCode !== "USD" ||
          identity.Type !== "ETF"
        )
          throw new BenchmarkEvidenceError("USD ETF identity unavailable.");
        const raw = await read(
          `eod/${symbol}.US`,
          { from, to: through, period: "d", order: "a" },
          900000,
        );
        return {
          ...base,
          status: "available" as const,
          reason:
            "Hypothetical matched cash flows at dated closes; dividends reinvested.",
          points: matchedBenchmark(rows, dates, raw),
        };
      } catch (e) {
        return {
          ...base,
          status: "unavailable" as const,
          reason:
            e instanceof BenchmarkEvidenceError
              ? e.message
              : "Benchmark evidence unavailable.",
          points: [],
        };
      }
    }),
  );
}
