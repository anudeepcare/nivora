export const earningsSessions = [
  "before_open",
  "after_close",
  "during_market",
  "unknown",
] as const;
export type EarningsSession = (typeof earningsSessions)[number];
export type GlobalEarning = {
  ticker: string;
  company: string;
  date: string;
  session: EarningsSession;
  confirmed: boolean;
  quarter: string | null;
  callTime: string | null;
  webcast: string | null;
  eps: number | null;
  revenue: number | null;
  reported: boolean;
};
export type GlobalCalendar = {
  events: GlobalEarning[];
  preview: boolean;
  totalCount: number | null;
  windowStart: string;
  windowEnd: string;
  omitted: number;
  retrievedAt: string;
  generatedAt: string | null;
};
const object = (x: unknown): Record<string, unknown> | null =>
  x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
const text = (x: unknown, max = 160) =>
  typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null;
const number = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) ? x : null;
export function calendarDate(x: unknown): x is string {
  return (
    typeof x === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(x) &&
    Number.isFinite(Date.parse(x)) &&
    new Date(x).toISOString().slice(0, 10) === x
  );
}
export function earningsWindow(days: number, now = new Date()) {
  if (![7, 14, 30].includes(days) || !Number.isFinite(now.getTime()))
    return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const from = `${get("year")}-${get("month")}-${get("day")}`;
  return {
    from,
    to: new Date(Date.parse(from) + (days - 1) * 86400000)
      .toISOString()
      .slice(0, 10),
  };
}
const safeUrl = (x: unknown) => {
  try {
    const u = new URL(String(x));
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
};
export function globalEarnings(
  raw: unknown,
  window: { from: string; to: string },
  retrievedAt: string,
): GlobalCalendar | null {
  const root = object(raw),
    data = object(root?.data),
    meta = object(data?.metadata);
  if (
    !root ||
    typeof root.isPreview !== "boolean" ||
    !data ||
    !meta ||
    meta.source !== "sentisense" ||
    !Array.isArray(data.earnings) ||
    data.earnings.length > 10000 ||
    meta.count !== data.earnings.length ||
    !calendarDate(meta.windowStart) ||
    !calendarDate(meta.windowEnd) ||
    meta.windowStart < window.from ||
    meta.windowEnd > window.to ||
    meta.windowStart > meta.windowEnd
  )
    return null;
  const events: GlobalEarning[] = [];
  let omitted = 0;
  const seen = new Set<string>();
  for (const value of data.earnings) {
    const r = object(value),
      ticker = text(r?.ticker, 24),
      date = r?.earningsDate,
      session = r?.earningsTime;
    if (
      !r ||
      !ticker ||
      !/^[A-Za-z0-9.^_-]{1,24}$/.test(ticker) ||
      !calendarDate(date) ||
      date < meta.windowStart ||
      date > meta.windowEnd ||
      typeof r.confirmed !== "boolean" ||
      !earningsSessions.includes(session as EarningsSession)
    ) {
      omitted++;
      continue;
    }
    const id = `${ticker}:${date}`;
    if (seen.has(id)) {
      return null;
    }
    seen.add(id);
    const call = text(r.callTime, 60);
    const validCall =
      r.confirmed &&
      call &&
      /T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(call) &&
      Number.isFinite(Date.parse(call))
        ? call
        : null;
    events.push({
      ticker,
      company: text(r.companyName) ?? ticker,
      date,
      session: session as EarningsSession,
      confirmed: r.confirmed,
      quarter: text(r.fiscalQuarter, 40),
      callTime: validCall,
      webcast: r.confirmed ? safeUrl(r.webcastUrl) : null,
      eps: number(r.estimatedEps),
      revenue: number(r.estimatedRevenue),
      reported:
        number(r.actualEps) !== null || number(r.actualRevenue) !== null,
    });
  }
  events.sort(
    (a, b) => a.date.localeCompare(b.date) || a.ticker.localeCompare(b.ticker),
  );
  return {
    events,
    preview: root.isPreview,
    totalCount:
      Number.isInteger(root.totalCount) && Number(root.totalCount) >= 0
        ? Number(root.totalCount)
        : null,
    windowStart: meta.windowStart,
    windowEnd: meta.windowEnd,
    omitted,
    retrievedAt,
    generatedAt:
      typeof meta.generatedAt === "number" &&
      Number.isFinite(meta.generatedAt) &&
      meta.generatedAt > 0 &&
      meta.generatedAt * 1000 <= Date.parse(retrievedAt)
        ? new Date(meta.generatedAt * 1000).toISOString()
        : null,
  };
}
