import type { Position } from "./types";
import type { QuoteRows } from "./portfolio-quotes";

export type DayMover = {
  symbol: string;
  value: number;
  move: number;
  changePct: number;
};
export type PortfolioDay = {
  /** Non-cash holdings with a usable USD price, at those prices. */
  value: number;
  priced: number;
  holdings: number;
  /** Holdings whose quote carries a current session change. */
  covered: number;
  coveredValue: number;
  /** Dollar and percent move of the covered holdings only; null when none qualify. */
  move: number | null;
  movePct: number | null;
  gainers: DayMover[];
  decliners: DayMover[];
  asOf: string | null;
};
const DAY = 86400000;
const finite = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);

/** Latest-session move of today's holdings from each quote's own reported change.
 * Quotes older than four days, missing changes and non-USD prices are left out and counted, never assumed flat.
 * This is a price move on current quantities, not account performance: trades, cash and deposits are excluded. */
export function portfolioDay(
  positions: Position[],
  quotes: QuoteRows,
  now = Date.now(),
  limit = 3,
): PortfolioDay {
  const quantities = new Map<string, number>();
  for (const p of positions) {
    if (p.assetType === "cash" || !finite(p.quantity) || p.quantity <= 0)
      continue;
    quantities.set(p.symbol, (quantities.get(p.symbol) ?? 0) + p.quantity);
  }
  let value = 0,
    priced = 0,
    coveredValue = 0,
    prior = 0,
    newest = -Infinity;
  const movers: DayMover[] = [];
  for (const [symbol, quantity] of quantities) {
    const q = quotes[symbol]?.quote;
    if (!q || q.currency !== "USD" || !finite(q.price) || q.price <= 0)
      continue;
    const worth = quantity * q.price;
    value += worth;
    priced++;
    const at = Date.parse(q.asOf ?? "");
    // The display staleness flag is minutes-strict during sessions; a quote
    // that is a few minutes old still carries that session's change. Age is
    // bounded by its own timestamp instead.
    if (
      !finite(q.changePct) ||
      q.changePct <= -100 ||
      !Number.isFinite(at) ||
      at > now + 60000 ||
      now - at > 4 * DAY
    )
      continue;
    const before = worth / (1 + q.changePct / 100);
    coveredValue += worth;
    prior += before;
    newest = Math.max(newest, at);
    movers.push({
      symbol,
      value: worth,
      move: worth - before,
      changePct: q.changePct,
    });
  }
  const move = movers.length ? coveredValue - prior : null;
  return {
    value,
    priced,
    holdings: quantities.size,
    covered: movers.length,
    coveredValue,
    move,
    movePct: move != null && prior > 0 ? (move / prior) * 100 : null,
    gainers: movers
      .filter((m) => m.move > 0)
      .sort((a, b) => b.move - a.move)
      .slice(0, limit),
    decliners: movers
      .filter((m) => m.move < 0)
      .sort((a, b) => a.move - b.move)
      .slice(0, limit),
    asOf: Number.isFinite(newest) ? new Date(newest).toISOString() : null,
  };
}
