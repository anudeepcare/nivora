import {
  cleanTransactions,
  reconcileTransactions,
  type Transaction,
} from "./transaction-ledger.ts";
/** Evidence must come from verified provider contracts, never an inferred price adjustment. */
export type AccountPriceEvidence = {
  symbol: string;
  currency: "USD";
  basis: "unadjusted";
  source: string;
  from: string;
  through: string;
  splitsComplete: boolean;
  splits: { date: string; ratio: number }[];
  closes: { date: string; close: number }[];
};
export type AccountPerformanceInput = {
  /** Account import/reconciliation must establish this; an existing position snapshot does not. */
  completeFromInception: boolean;
  transactions: Transaction[];
  dates: string[];
  through: string;
  prices: AccountPriceEvidence[];
};
export type AccountPerformancePoint = {
  date: string;
  equity: number;
  cash: number;
  securities: number;
  netContributions: number;
  gain: number;
};
const day = (s: string) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
/** Dated ledger equity, not current-holdings backfill. No TWR: intraday flow timing is unknown. */
export function accountPerformance(input: AccountPerformanceInput): {
  status: "available" | "unavailable";
  reason: string;
  points: AccountPerformancePoint[];
  returnPct: null;
  sources: string[];
} {
  const unavailable = (reason: string) => ({
    status: "unavailable" as const,
    reason,
    points: [],
    returnPct: null,
    sources: [],
  });
  try {
    if (input.completeFromInception !== true)
      return unavailable("A complete inception ledger has not been verified.");
    if (
      !day(input.through) ||
      input.through > new Date().toISOString().slice(0, 10) ||
      !input.dates.length ||
      input.dates.length > 366
    )
      return unavailable("Choose up to 366 valid completed valuation dates.");
    const dates = input.dates;
    if (
      dates.some(
        (d, i) => !day(d) || d > input.through || (i > 0 && d <= dates[i - 1]),
      )
    )
      return unavailable("Valuation dates must be unique and increasing.");
    const transactions = cleanTransactions(input.transactions);
    if (
      !transactions.length ||
      transactions.some((t) => t.date > input.through)
    )
      return unavailable(
        "Ledger is empty or extends beyond the requested evidence window.",
      );
    const inception = transactions.reduce(
      (d, t) => (t.date < d ? t.date : d),
      transactions[0].date,
    );
    if (dates[0] < inception)
      return unavailable("Valuation precedes the inception ledger.");
    const symbols = [
      ...new Set(transactions.filter((t) => t.symbol).map((t) => t.symbol)),
    ];
    const evidence = new Map<string, AccountPriceEvidence>();
    for (const p of input.prices) {
      if (evidence.has(p.symbol))
        return unavailable("Duplicate security evidence.");
      evidence.set(p.symbol, p);
    }
    for (const symbol of symbols) {
      const p = evidence.get(symbol);
      if (
        !p ||
        p.basis !== "unadjusted" ||
        p.currency !== "USD" ||
        !p.source.trim() ||
        p.splitsComplete !== true ||
        !day(p.from) ||
        !day(p.through) ||
        p.from > inception ||
        p.through < input.through
      )
        return unavailable(
          `Unadjusted USD prices and complete split evidence required for ${symbol}.`,
        );
      if (
        !Array.isArray(p.splits) ||
        !Array.isArray(p.closes) ||
        p.closes.some(
          (c, i) =>
            !day(c.date) ||
            !Number.isFinite(c.close) ||
            c.close <= 0 ||
            (i > 0 && c.date <= p.closes[i - 1].date),
        )
      )
        return unavailable(`Invalid price evidence for ${symbol}.`);
      const splitDates = new Set<string>();
      for (const split of p.splits) {
        if (
          !day(split.date) ||
          !Number.isFinite(split.ratio) ||
          split.ratio <= 0 ||
          splitDates.has(split.date)
        )
          return unavailable(`Invalid split evidence for ${symbol}.`);
        splitDates.add(split.date);
        if (split.date < inception || split.date > input.through) continue;
        if (
          transactions.some(
            (t) =>
              t.symbol === symbol &&
              t.date === split.date &&
              ["buy", "sell"].includes(t.type),
          )
        )
          return unavailable(
            `Same-day split/trade ordering requires intraday evidence for ${symbol}.`,
          );
        const before = reconcileTransactions(
          transactions.filter((t) => t.date < split.date),
        );
        const held = before.positions.filter((p) => p.symbol === symbol);
        for (const position of held) {
          const entries = transactions.filter(
            (t) =>
              t.symbol === symbol &&
              t.account === position.account &&
              t.type === "split" &&
              t.date === split.date,
          );
          if (entries.length !== 1 || entries[0].quantity !== split.ratio)
            return unavailable(
              `Ledger split does not match provider evidence for ${symbol}.`,
            );
        }
      }
      for (const t of transactions.filter(
        (t) => t.symbol === symbol && t.type === "split",
      ))
        if (!p.splits.some((s) => s.date === t.date && s.ratio === t.quantity))
          return unavailable(`Uncorroborated ledger split for ${symbol}.`);
    }
    const points: AccountPerformancePoint[] = [];
    for (const date of dates) {
      const ledger = reconcileTransactions(
        transactions.filter((t) => t.date <= date),
      );
      if (ledger.errors.length)
        return unavailable(
          "Ledger reconciliation failed; missing deposits, shares or borrowing cannot be assumed.",
        );
      const cash = ledger.accounts.reduce((v, a) => v + a.cash, 0);
      let securities = 0;
      for (const position of ledger.positions) {
        const close = evidence
          .get(position.symbol)
          ?.closes.find((c) => c.date === date)?.close;
        if (close === undefined)
          return unavailable(
            `Missing exact-date close for ${position.symbol} on ${date}.`,
          );
        securities += position.quantity * close;
      }
      const equity = cash + securities,
        gain = equity - ledger.external;
      if (
        ![cash, securities, equity, gain, ledger.external].every(
          Number.isFinite,
        )
      )
        return unavailable("Nonfinite ledger valuation.");
      points.push({
        date,
        equity,
        cash,
        securities,
        netContributions: ledger.external,
        gain,
      });
    }
    return {
      status: "available",
      reason:
        "Verified-input ledger equity. Percent returns unavailable without cash-flow timing; deposits and withdrawals are not gains.",
      points,
      returnPct: null,
      sources: [...new Set(symbols.map((s) => evidence.get(s)!.source))],
    };
  } catch {
    return unavailable("Malformed or unsupported account evidence.");
  }
}
