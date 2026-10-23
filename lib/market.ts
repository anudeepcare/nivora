import type { Candle, Quote } from "./types";
export const numeric = (value: unknown): number | null =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value))
    ? Number(value)
    : null;
export function normalizeQuote(
  raw: Record<string, unknown>,
  symbol: string,
  now = Date.now(),
): Quote {
  const regularStamp = numeric(raw.last_quote_at) ?? numeric(raw.timestamp);
  const extendedStamp = numeric(raw.extended_timestamp), extendedPrice = numeric(raw.extended_price);
  const useExtended = !symbol.includes("/") && extendedPrice != null && extendedPrice > 0 && extendedStamp != null && extendedStamp * 1000 <= now + 60000 && (regularStamp == null || extendedStamp > regularStamp);
  const price = useExtended ? extendedPrice : numeric(raw.close),
    timestamp = useExtended ? extendedStamp : regularStamp;
  const milliseconds = timestamp == null ? NaN : timestamp * 1000;
  const asOf =
    Number.isFinite(milliseconds) && Math.abs(milliseconds) < 8.64e15
      ? new Date(milliseconds).toISOString()
      : null;
  const open = raw.is_market_open === true || raw.is_market_open === "true";
  const reportedCurrency =
    raw.currency ??
    (raw.symbol === symbol && symbol.endsWith("/USD") ? "USD" : null);
  const currency =
    typeof reportedCurrency === "string" &&
    /^[A-Z]{3,6}$/.test(reportedCurrency)
      ? reportedCurrency
      : "";
  const continuous = symbol.includes("/");
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const part=(key:string)=>parts.find(p=>p.type===key)?.value||'';
  const minutes=Number(part('hour'))*60+Number(part('minute'));
  // This tightens freshness during scheduled US hours; it does not assert an
  // exchange is open on holidays or overwrite the provider's session report.
  const scheduledHours=!['Sat','Sun'].includes(part('weekday'))&&minutes>=570&&minutes<960;
  const extended = useExtended || raw.is_extended_hours === true || raw.is_extended_hours === "true";
  const extendedWindow = !["Sat", "Sun"].includes(part("weekday")) && minutes >= 240 && minutes < 1200;
  const ageLimit = open || continuous || extended || extendedWindow || scheduledHours ? 3 * 60_000 : 4 * 86400_000;
  const observedParts = asOf ? new Intl.DateTimeFormat("en-US", {timeZone:"America/New_York",hour:"2-digit",hourCycle:"h23"}).formatToParts(milliseconds) : [];
  const observedHour = Number(observedParts.find(p=>p.type==="hour")?.value);
  return {
    price: price != null && price > 0 ? price : null,
    changePct: useExtended ? (numeric(raw.previous_close) != null && Number(raw.previous_close) > 0 ? (price! / Number(raw.previous_close) - 1) * 100 : null) : numeric(raw.percent_change),
    previousClose: numeric(raw.previous_close),
    currency,
    asOf,
    session: continuous
      ? "Continuous market"
      : extended
        ? observedHour < 12 ? "Premarket" : "After-hours"
      : open
        ? "Market open"
        : "Last available close",
    source: "Twelve Data",
    stale:
      !asOf ||
      !currency ||
      milliseconds > now + 60_000 ||
      now - milliseconds > ageLimit,
  };
}
export function normalizeBars(
  raw: unknown,
  intraday: boolean,
  now = Date.now(),
): Candle[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Map<string, Candle>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const text = String(row.datetime),
      day = text.slice(0, 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(Date.parse(day)) ||
      new Date(day).toISOString().slice(0, 10) !== day
    )
      continue;
    if (intraday && !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(text))
      continue;
    const stamp = intraday
      ? Date.parse(text.replace(" ", "T") + "Z")
      : Date.parse(day);
    if (!Number.isFinite(stamp) || (intraday && stamp > now)) continue;
    const [open, high, low, close] = [
      row.open,
      row.high,
      row.low,
      row.close,
    ].map(numeric);
    if (
      open == null ||
      high == null ||
      low == null ||
      close == null ||
      Math.min(open, high, low, close) <= 0 ||
      high < Math.max(open, close, low) ||
      low > Math.min(open, close, high)
    )
      continue;
    const time = intraday ? new Date(stamp).toISOString() : day;
    unique.set(time, {
      time,
      open,
      high,
      low,
      close,
      volume: Math.max(0, numeric(row.volume) ?? 0),
    });
  }
  return [...unique.values()].sort((a, b) => a.time.localeCompare(b.time));
}

export function supportedListing(raw: Record<string, unknown>): boolean {
  const exchange = String(raw.exchange ?? "").toUpperCase();
  return (
    raw.currency === "USD" &&
    [
      "NASDAQ",
      "NYSE",
      "NYSE ARCA",
      "NYSE AMERICAN",
      "AMEX",
      "NYSE MKT",
      "BATS",
      "CBOE",
    ].includes(exchange)
  );
}
