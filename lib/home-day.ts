import type { Position, Quote } from "./types";
import type { MarketEvent } from "./home-feed";
const marketDate = (at: number) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join("-");
};
/** Estimate price-reference change on today's recorded units, never brokerage P&L. */
export function homeDay(
  positions: Position[],
  quotes: Record<string, Quote>,
  events: MarketEvent[],
  asOf: string,
) {
  const now = Date.parse(asOf),
    today = Number.isFinite(now) ? marketDate(now) : "";
  const quantities = new Map<string, number>();
  for (const p of positions)
    if (
      p.assetType === "stock" &&
      p.currency === "USD" &&
      Number.isFinite(p.quantity) &&
      p.quantity > 0
    )
      quantities.set(p.symbol, (quantities.get(p.symbol) ?? 0) + p.quantity);
  const priced = [...quantities].flatMap(([symbol, quantity]) => {
    const q = quotes[symbol],
      at = Date.parse(q?.asOf ?? "");
    if (
      !q ||
      q.currency !== "USD" ||
      q.price == null ||
      !Number.isFinite(q.price) ||
      q.price <= 0 ||
      !Number.isFinite(now) ||
      !Number.isFinite(at) ||
      at > now + 60000 ||
      now - at > 4 * 86400000
    )
      return [];
    return [
      {
        symbol,
        quantity,
        price: q.price,
        value: quantity * q.price,
        session: marketDate(at),
        change: q.changePct,
        asOf: q.asOf!,
      },
    ];
  });
  const session =
    priced
      .map((p) => p.session)
      .sort()
      .at(-1) ?? null;
  const moves = priced
    .flatMap((p) => {
      if (
        p.session !== session ||
        p.change == null ||
        !Number.isFinite(p.change) ||
        p.change <= -100
      )
        return [];
      const impact = (p.quantity * p.price * p.change) / (100 + p.change);
      return Number.isFinite(impact) ? [{ ...p, impact }] : [];
    })
    .sort(
      (a, b) =>
        Math.abs(b.impact) - Math.abs(a.impact) ||
        a.symbol.localeCompare(b.symbol),
    );
  const mover = moves.find((m) => m.impact !== 0);
  const upcoming = events
    .filter(
      (e) =>
        quantities.has(e.symbol) &&
        e.date >= today &&
        Date.parse(e.date) <= now + 7 * 86400000,
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (priced.find((p) => p.symbol === b.symbol)?.value ?? 0) -
          (priced.find((p) => p.symbol === a.symbol)?.value ?? 0) ||
        a.symbol.localeCompare(b.symbol),
    );
  const largest = [...priced].sort(
    (a, b) => b.value - a.value || a.symbol.localeCompare(b.symbol),
  )[0];
  const focus = mover
    ? { symbol: mover.symbol, kind: "impact" as const, impact: mover.impact }
    : upcoming[0]
      ? {
          symbol: upcoming[0].symbol,
          kind: "event" as const,
          date: upcoming[0].date,
        }
      : largest
        ? { symbol: largest.symbol, kind: "exposure" as const }
        : null;
  return {
    session,
    net: moves.length ? moves.reduce((n, m) => n + m.impact, 0) : null,
    covered: moves.length,
    total: quantities.size,
    moves,
    focus,
    upcoming,
    priced: priced.length,
    positive: moves.filter((m) => m.impact > 0).length,
    negative: moves.filter((m) => m.impact < 0).length,
  };
}
