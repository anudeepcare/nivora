export type CalendarKind = "ipos" | "splits";
export type CorporateEvent = {
  symbol: string;
  researchSymbol: string | null;
  name: string | null;
  date: string;
  status: string;
  currency: string | null;
  exchange: string | null;
  priceLow: number | null;
  priceHigh: number | null;
  offerPrice: number | null;
  shares: number | null;
  ratio: string | null;
};
export type CorporateCalendar = {
  kind: CalendarKind;
  from: string;
  to: string;
  source: "EODHD";
  retrievedAt: string;
  entitlement: "unverified";
  rows: CorporateEvent[];
  total: number;
  truncated: boolean;
};
const positive = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
const text = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v
    ? v
    : null;
export function calendarWindow(days: number, now = new Date()) {
  if (days !== 7 && days !== 30)
    throw Error("Choose a 7-day or 30-day window.");
  return {
    from: now.toISOString().slice(0, 10),
    to: new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10),
  };
}
export function normalizeEodCalendar(
  kind: CalendarKind,
  raw: unknown,
  from: string,
  to: string,
): CorporateEvent[] {
  if (
    !raw ||
    typeof raw !== "object" ||
    !Array.isArray((raw as Record<string, unknown>)[kind])
  )
    throw Error("The provider returned an invalid calendar.");
  const values = (raw as Record<CalendarKind, unknown[]>)[kind];
  return values
    .flatMap((value): CorporateEvent[] => {
      if (!value || typeof value !== "object" || Array.isArray(value))
        return [];
      const x = value as Record<string, unknown>,
        symbol = text(x.code),
        day = date(kind === "ipos" ? x.start_date : x.split_date);
      if (!symbol || !day || day < from || day > to) return [];
      const old = positive(x.old_shares),
        next = positive(x.new_shares),
        valid = old !== null && next !== null;
      return [
        {
          symbol,
          researchSymbol: /^[A-Z][A-Z0-9.-]{0,14}\.US$/.test(symbol)
            ? symbol.slice(0, -3)
            : null,
          name: text(x.name),
          date: day,
          status:
            kind === "ipos"
              ? (text(x.deal_type) ?? "Status not supplied")
              : !valid
                ? "Ratio not supplied"
                : next < old
                  ? "Reverse split"
                  : next > old
                    ? "Forward split"
                    : "Unchanged share count",
          currency: text(x.currency),
          exchange: text(x.exchange),
          priceLow: positive(x.price_from),
          priceHigh: positive(x.price_to),
          offerPrice: positive(x.offer_price),
          shares: positive(x.shares),
          ratio: valid ? `${old} → ${next}` : null,
        },
      ];
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol),
    );
}
