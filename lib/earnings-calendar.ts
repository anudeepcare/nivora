import type { Research } from "./types";

const validDay = (value: string | undefined): value is string =>
  !!value &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
const marketDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
/** Scheduled dates are observations, not confirmed events. Thirty days is a
 * conservative display freshness limit, not a claim about provider coverage. */
export function earningsCalendar(r: Research, now: number) {
  const applicable = r.company.assetType === "stock";
  const updatedAt = r.evidence?.updatedAt?.slice(0, 10);
  const stamp = Date.parse(r.evidence?.updatedAt ?? "");
  const current =
    applicable &&
    Number.isFinite(now) &&
    validDay(updatedAt) &&
    Number.isFinite(stamp) &&
    stamp <= now &&
    now - stamp <= 30 * 86400000;
  const today = Number.isFinite(now) ? marketDay.format(now) : "";
  const next = current
    ? ((r.evidence?.earnings ?? [])
        .filter((e) => validDay(e.date) && e.date >= today && e.actual == null)
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null)
    : null;
  return {
    next,
    updatedAt: validDay(updatedAt) ? updatedAt : null,
    current,
    status: !applicable
      ? "Not applicable to crypto"
      : !r.evidence?.updatedAt
        ? "Earnings calendar unavailable"
        : !current
          ? "Earnings calendar needs refresh; a valid dataset update within 30 days is required"
          : next
            ? "Unreported scheduled earnings; date may change"
            : "No upcoming earnings date supplied; coverage may be incomplete",
  };
}
