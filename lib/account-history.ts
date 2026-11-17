import {
  accountPerformance,
  type AccountPriceEvidence,
} from "./account-performance.ts";
import {
  cleanTransactions,
  reconcileTransactions,
} from "./transaction-ledger.ts";
export class AccountHistoryError extends Error {}
type Reader = (
  path: string,
  params: Record<string, string>,
  ttl: number,
) => Promise<unknown>;
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const day = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
/** Uses documented raw close, never adjusted_close. Full split range is mandatory.
 * https://eodhd.com/financial-apis/api-for-historical-data-and-volumes */
export async function accountHistory(
  rows: unknown,
  confirmed: boolean,
  read: Reader,
  now = Date.now(),
) {
  if (!confirmed)
    throw new AccountHistoryError(
      "Confirm that the saved ledger contains every account transaction from inception.",
    );
  const deadline = Date.now() + 35000;
  const boundedRead: Reader = (path, params, ttl) => {
    if (Date.now() >= deadline)
      throw new AccountHistoryError(
        "History evidence timed out. Retry; completed provider reads are cached.",
      );
    return read(path, params, ttl);
  };
  const transactions = cleanTransactions(rows);
  const from = transactions.map((t) => t.date).sort()[0];
  const through = new Date(now - 86400000).toISOString().slice(0, 10);
  if (
    !from ||
    from > through ||
    Date.parse(through) - Date.parse(from) > 365 * 86400000
  )
    throw new AccountHistoryError(
      "History currently supports complete ledgers up to one year old, through yesterday.",
    );
  if (transactions.some((t) => t.date > through))
    throw new AccountHistoryError(
      "Wait until all saved transaction dates have completed before building history.",
    );
  // Validate the entire saved ledger, including activity after the last priced day.
  for (const date of [...new Set(transactions.map((t) => t.date))].sort()) {
    if (
      reconcileTransactions(transactions.filter((t) => t.date <= date)).errors
        .length
    )
      throw new AccountHistoryError(
        `Ledger reconciliation failed on ${date}; review missing cash, shares or unsupported borrowing before building history.`,
      );
  }
  const symbols = [
    ...new Set(transactions.filter((t) => t.symbol).map((t) => t.symbol)),
  ];
  if (
    symbols.length > 10 ||
    symbols.some((s) => !/^[A-Z][A-Z0-9-]{0,9}$/.test(s))
  )
    throw new AccountHistoryError(
      "History currently supports up to ten US-listed USD instruments.",
    );
  const prices: AccountPriceEvidence[] = [];
  // Two securities at a time; shared provider cache/quota is supplied by caller.
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(2, symbols.length) }, async () => {
      while (next < symbols.length) {
        const symbol = symbols[next++],
          ticker = `${symbol}.US`;
        const general = object(
          await boundedRead(
            `fundamentals/${ticker}`,
            { filter: "General" },
            86400000,
          ),
        );
        if (general.CurrencyCode !== "USD" || general.Code !== symbol)
          throw new AccountHistoryError(
            `USD instrument identity could not be verified for ${symbol}.`,
          );
        const raw = await boundedRead(
          `eod/${ticker}`,
          { from, to: through, period: "d", order: "a" },
          900000,
        );
        const splitRaw = await boundedRead(
          `splits/${ticker}`,
          { from, to: through },
          86400000,
        );
        if (!Array.isArray(raw) || !Array.isArray(splitRaw))
          throw new AccountHistoryError(
            `Price or split coverage is unavailable for ${symbol}.`,
          );
        const closes = raw.map((v) => {
          const r = object(v);
          if (
            !day(r.date) ||
            typeof r.close !== "number" ||
            !Number.isFinite(r.close) ||
            r.close <= 0 ||
            r.date < from ||
            r.date > through
          )
            throw new AccountHistoryError("Invalid raw price evidence.");
          return { date: r.date, close: r.close };
        });
        const splits = splitRaw.map((v) => {
          const r = object(v),
            parts =
              typeof r.split === "string" ? r.split.split("/").map(Number) : [];
          if (
            !day(r.date) ||
            r.date < from ||
            r.date > through ||
            parts.length !== 2 ||
            parts.some((n) => !Number.isFinite(n) || n <= 0)
          )
            throw new AccountHistoryError("Invalid split evidence.");
          return { date: r.date, ratio: parts[0] / parts[1] };
        });
        if (!closes.length)
          throw new AccountHistoryError(`No completed prices for ${symbol}.`);
        prices.push({
          symbol,
          currency: "USD",
          basis: "unadjusted",
          source: "EODHD",
          from,
          through,
          splitsComplete: true,
          splits,
          closes,
        });
      }
    }),
  );
  const dates = prices.length
    ? [...new Set(prices.flatMap((p) => p.closes.map((c) => c.date)))].sort()
    : [from, through].filter((d, i, a) => a.indexOf(d) === i);
  const lastValuationDate = dates.at(-1) ?? null;
  if (
    !lastValuationDate ||
    transactions.some((t) => t.date > lastValuationDate)
  )
    throw new AccountHistoryError(
      `Saved transactions extend beyond the last available valuation date (${lastValuationDate ?? "none"}). No partial account history is shown.`,
    );
  const result = accountPerformance({
    completeFromInception: true,
    transactions,
    dates,
    through,
    prices,
  });
  return {
    ...result,
    requestedThrough: through,
    lastValuationDate,
    reason:
      result.status === "available"
        ? "Based on your confirmed complete ledger and dated raw closes. Deposits are not gains; percentage returns are not calculated."
        : result.reason,
    ledgerCompleteness: "user-confirmed" as const,
  };
}
