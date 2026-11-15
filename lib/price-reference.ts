import type { Research } from "./types";
import { quoteHealth } from "./quote-health.ts";
import { settledStudyBars, studyMarket } from "./settled-study-bars.ts";

export type PriceReference = {
  price: number;
  asOf: string;
  basis: "quote" | "settled-close";
  currency: string;
};
const DAY = 86400000;
const usExchange =
  /^(NASDAQ|NYSE|NYSE ARCA|NYSEARCA|ARCA|AMEX|NYSE AMERICAN|NYSEAMERICAN|BATS|CBOE|OTC|OTCQX|OTCQB|PINK|US)$/i;
const newYorkClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});
function quoteAtOrAfterClose(r: Research, asOf: string, date: string) {
  if (r.company.assetType === "stock" && usExchange.test(r.company.exchange)) {
    const parts = newYorkClock.formatToParts(Date.parse(asOf));
    const part = (name: string) =>
      parts.find((p) => p.type === name)?.value ?? "";
    const quoteDate = `${part("year")}-${part("month")}-${part("day")}`;
    // Compare with the regular-session close, not midnight at the start of
    // the daily bar. Local clock conversion handles both EST and EDT, and
    // preserves a genuinely later eligible after-hours observation.
    return (
      quoteDate > date || (quoteDate === date && Number(part("hour")) >= 16)
    );
  }
  return (
    Date.parse(asOf) >=
    Date.parse(date) + (r.company.assetType === "crypto" ? DAY : 36 * 3600000)
  );
}
/** Daily bars in listing currency; the source date is retained, not a fabricated timestamp. */
export function settledPriceBars(r: Research, now: number) {
  if (
    !Number.isFinite(now) ||
    !r.company.currency ||
    r.quote.currency !== r.company.currency
  )
    return [];
  // A price-only refresh cannot certify that an earlier captured daily bar
  // reached its final close. History knowledge is bounded by its own snapshot.
  const captured = Date.parse(r.retrievedAt);
  const historyTime = Number.isFinite(captured) ? Math.min(now, captured) : now;
  return settledStudyBars(
    r.history,
    new Date(historyTime).toISOString(),
    studyMarket(r),
  );
}

export function selectPriceReference(
  r: Research,
  now: number,
): PriceReference | null {
  if (
    !Number.isFinite(now) ||
    !r.company.currency ||
    r.quote.currency !== r.company.currency
  )
    return null;
  const q = quoteHealth(r.quote, now)!;
  const last = settledPriceBars(r, now).at(-1);
  if (
    !q.stale &&
    q.price != null &&
    Number.isFinite(q.price) &&
    q.price > 0 &&
    q.asOf &&
    (!last || quoteAtOrAfterClose(r, q.asOf, last.time))
  ) {
    return {
      price: q.price,
      asOf: q.asOf,
      basis: "quote",
      currency: q.currency,
    };
  }
  if (!last || now - Date.parse(last.time) > 4 * DAY) return null;
  return {
    price: last.close,
    asOf: last.time,
    basis: "settled-close",
    currency: r.company.currency,
  };
}
