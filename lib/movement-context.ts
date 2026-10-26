import type { Research } from "./types";
import { advancedStudies } from "./advanced-research.ts";
import { quoteHealth } from "./quote-health.ts";
type Headline = { date: string; title: string; url: string };
export function movementContext(r: Research, headlines: Headline[]) {
  const clock = r.priceObservedAt ?? r.retrievedAt,
    now = Date.parse(clock);
  const q = quoteHealth(r.quote, now)!,
    at = Date.parse(q.asOf ?? "");
  const calendar = new Intl.DateTimeFormat("en-CA", {
    timeZone: r.company.assetType === "crypto" ? "UTC" : "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const day = (ms: number) =>
    Number.isFinite(ms) ? calendar.format(new Date(ms)) : "";
  const validPrice = q.price != null && Number.isFinite(q.price) && q.price > 0;
  const change =
    validPrice && Number.isFinite(q.changePct) && q.changePct != null
      ? q.changePct
      : validPrice &&
          q.previousClose != null &&
          Number.isFinite(q.previousClose) &&
          q.previousClose > 0
        ? ((q.price! - q.previousClose) / q.previousClose) * 100
        : null;
  const seen = new Set<string>();
  const coverage = headlines
    .filter((n) => {
      const t = Date.parse(n.date);
      if (
        !Number.isFinite(now) ||
        !Number.isFinite(t) ||
        t > now ||
        now - t > 7 * 86400000 ||
        !n.title.trim()
      )
        return false;
      try {
        const u = new URL(n.url);
        if (
          u.protocol !== "https:" ||
          u.username ||
          u.password ||
          seen.has(u.href)
        )
          return false;
        seen.add(u.href);
        return true;
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2)
    .map((n) => ({
      ...n,
      publisher: new URL(n.url).hostname.replace(/^www\./, ""),
    }));
  const earnings =
    r.company.assetType === "stock"
      ? ((r.evidence?.earnings ?? [])
          .filter((e) => {
            const t = Date.parse(e.date);
            return (
              Number.isFinite(t) &&
              /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
              new Date(t).toISOString().slice(0, 10) === e.date &&
              e.date >= day(now) &&
              e.actual == null
            );
          })
          .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null)
      : null;
  const study = advancedStudies(r.history, clock);
  const volume =
    study.asOf &&
    Number.isFinite(now) &&
    now - Date.parse(study.asOf) <= 10 * 86400000
      ? study.relativeVolume
      : null;
  return {
    price: validPrice ? q.price : null,
    change,
    today: validPrice && !q.stale && day(at) === day(now),
    asOf: q.asOf,
    session: q.session,
    stale: q.stale,
    headlines: coverage,
    earnings,
    relativeVolume: volume,
    volumeDate: study.asOf,
    verifiedCause: null,
  };
}
