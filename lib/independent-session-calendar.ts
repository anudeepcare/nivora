/** INACTIVE: published scheduled sessions, not an actual-session or finalized-price oracle. */
const provenance = Object.freeze({
  version: "us-regular-equities-2026-schedule-v1",
  checkedOn: "2026-11-18",
  publicationTimestamp: null,
  coverageStart: "2026-01-01",
  coverageEnd: "2026-12-31",
  timezone: "America/New_York",
  sources: Object.freeze([
    "https://www.nyse.com/trade/hours-calendars",
    "https://classic.nasdaqtrader.com/Trader.aspx?id=Calendar",
    "https://classic.nasdaqtrader.com/content/TechnicalSupport/nasdaq_sys_hours.pdf",
  ]),
  limitation:
    "Scheduled regular equity sessions as published when checked, not point-in-time historical knowledge. Exceptional closures, venue/security halts, later revisions and provider bar completion are not verified.",
});
const safeguards = Object.freeze({
  provenance,
  calendarVerified: false as const,
  actualSessionVerified: false as const,
  providerBarFinalized: false as const,
  readyForPace: false as const,
});
const holidays = new Set([
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-04-03",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
]);
const early = new Set(["2026-11-27", "2026-12-24"]);
const clock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
function parts(ms: number) {
  const map = Object.fromEntries(
    clock.formatToParts(ms).map((p) => [p.type, p.value]),
  );
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}
function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^2026-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
function venue(value: unknown): value is "XNYS" | "XNAS" {
  return value === "XNYS" || value === "XNAS";
}
/** Convert local daytime using the runtime IANA timezone, never hand-coded DST dates. */
function utc(date: string, hour: number, minute: number): string | null {
  const nominal = Date.parse(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
  );
  const local = parts(nominal);
  const localAsUtc = Date.parse(
    `${local.date}T${String(local.hour).padStart(2, "0")}:${String(local.minute).padStart(2, "0")}:00Z`,
  );
  const adjusted = nominal + nominal - localAsUtc;
  const check = parts(adjusted);
  return check.date === date && check.hour === hour && check.minute === minute
    ? new Date(adjusted).toISOString()
    : null;
}
export function scheduledSession(mic: unknown, date: unknown) {
  const empty = {
    ...safeguards,
    date: null as string | null,
    mic: null as "XNYS" | "XNAS" | null,
    openAt: null as string | null,
    closeAt: null as string | null,
    earlyClose: false,
  };
  if (!venue(mic) || !validDate(date))
    return Object.freeze({
      ...empty,
      status: "unknown" as const,
      reason: "unsupported-venue-or-date",
    });
  const base = { ...empty, date, mic };
  if ([0, 6].includes(new Date(date + "T12:00:00Z").getUTCDay()))
    return Object.freeze({
      ...base,
      status: "closed" as const,
      reason: "weekend",
    });
  if (holidays.has(date))
    return Object.freeze({
      ...base,
      status: "closed" as const,
      reason: "published-holiday",
    });
  const openAt = utc(date, 9, 30),
    closeAt = utc(date, early.has(date) ? 13 : 16, 0);
  if (!openAt || !closeAt)
    return Object.freeze({
      ...base,
      status: "unknown" as const,
      reason: "timezone-conversion-unavailable",
    });
  return Object.freeze({
    ...base,
    status: "scheduled" as const,
    reason: "published-regular-equity-schedule",
    openAt,
    closeAt,
    earlyClose: early.has(date),
  });
}
/** Latest *scheduled* close within the bounded year. Never declares a bar settled/final. */
export function latestScheduledClose(mic: unknown, asOf: unknown) {
  const unknown = (reason: string) =>
    Object.freeze({
      ...safeguards,
      status: "unknown" as const,
      reason,
      session: null,
    });
  if (
    !venue(mic) ||
    typeof asOf !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(asOf)
  )
    return unknown("invalid-venue-or-utc-instant");
  const ms = Date.parse(asOf);
  if (
    !Number.isFinite(ms) ||
    new Date(ms).toISOString() !==
      (asOf.length === 20 ? asOf.slice(0, -1) + ".000Z" : asOf)
  )
    return unknown("invalid-utc-instant");
  const localDate = parts(ms).date;
  if (!validDate(localDate)) return unknown("outside-calendar-coverage");
  let cursor = Date.parse(localDate + "T12:00:00Z");
  for (let count = 0; count < 366; count++, cursor -= 86400000) {
    const date = new Date(cursor).toISOString().slice(0, 10);
    if (!validDate(date)) break;
    const session = scheduledSession(mic, date);
    if (session.status === "unknown") return unknown("schedule-unavailable");
    if (session.closeAt && Date.parse(session.closeAt) <= ms)
      return Object.freeze({
        ...safeguards,
        status: "scheduled-close" as const,
        reason: "scheduled-close-only-not-provider-finalization",
        session,
      });
  }
  return unknown("prior-session-outside-calendar-coverage");
}
