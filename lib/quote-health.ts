import type { Quote } from "./types";
const marketClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
let clockMinute = NaN,
  clockRegular = false;
// Scheduled US pre/post window tightens age only; it does not assert holiday trading.
function regularSession(now: number) {
  const key = Math.floor(now / 60000);
  if (key !== clockMinute) {
    const parts = marketClock.formatToParts(now),
      part = (k: string) => parts.find((p) => p.type === k)?.value || "",
      minute = Number(part("hour")) * 60 + Number(part("minute"));
    clockRegular =
      !["Sat", "Sun"].includes(part("weekday")) &&
      minute >= 240 &&
      minute < 1200;
    clockMinute = key;
  }
  return clockRegular;
}

/** Re-evaluate age on display; an old cached flag never proves freshness. */
export function quoteHealth(
  q: Quote | undefined,
  now = Date.now(),
): Quote | undefined {
  if (!q) return q;
  const stamp = Date.parse(q.asOf || ""),
    regular = regularSession(now);
  const continuous = /continuous/i.test(q.session),
    live = /^Live/.test(q.session) || /stream/i.test(q.source),
    delayed = /delayed|indicative/i.test(q.session + " " + q.source);
  const window = live
    ? 120000
    : continuous
      ? 180000
      : delayed && regular
        ? 45 * 60000
        : regular ||
            /Market open|1-minute|premarket|after-hours/i.test(q.session)
          ? 180000
          : 4 * 86400000;
  const badPrice =
    q.price != null && (!Number.isFinite(q.price) || q.price <= 0);
  const stale =
    q.stale ||
    badPrice ||
    !Number.isFinite(stamp) ||
    stamp > now + 60000 ||
    now - stamp > window;
  return stale === q.stale && !badPrice
    ? q
    : { ...q, stale, price: badPrice ? null : q.price };
}
