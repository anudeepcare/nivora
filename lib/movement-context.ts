import type { Research } from "./types";
import { quoteHealth } from "./quote-health.ts";
import { selectPriceReference, settledPriceBars } from "./price-reference.ts";
type Headline = { date: string; title: string; url: string };
export function movementContext(
  r: Research,
  headlines: Headline[],
  { now = Date.now() }: { now?: number } = {},
) {
  const q = Number.isFinite(now)
    ? quoteHealth(r.quote, now)!
    : { ...r.quote, stale: true };
  const reference = selectPriceReference(r, now),
    settled = settledPriceBars(r, now);
  const fallback = reference?.basis === "settled-close";
  const asOf = reference?.asOf ?? q.asOf,
    at = Date.parse(asOf ?? "");
  const calendar = new Intl.DateTimeFormat("en-CA", {
    timeZone: r.company.assetType === "crypto" ? "UTC" : "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const day = (ms: number) =>
    Number.isFinite(ms) ? calendar.format(new Date(ms)) : "";
  const price = reference?.price ?? q.price;
  const validPrice =
    price != null &&
    Number.isFinite(price) &&
    price > 0 &&
    q.currency === r.company.currency &&
    Number.isFinite(now) &&
    Number.isFinite(at) &&
    at <= now + 60000;
  const previous = fallback ? settled.at(-2) : null;
  const change = fallback
    ? previous
      ? ((price! - previous.close) / previous.close) * 100
      : null
    : validPrice && Number.isFinite(q.changePct) && q.changePct != null
      ? q.changePct
      : validPrice &&
          q.previousClose != null &&
          Number.isFinite(q.previousClose) &&
          q.previousClose > 0
        ? ((price! - q.previousClose) / q.previousClose) * 100
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
  const last = settled.at(-1),
    priorVolumes = settled.slice(-21, -1);
  const volumeRecent = !!last && now - Date.parse(last.time) <= 10 * 86400000;
  const volumeReady =
    priorVolumes.length === 20 &&
    [...priorVolumes, last!].every(
      (b) => Number.isFinite(b.volume) && b.volume > 0,
    );
  const volume =
    volumeRecent && volumeReady
      ? last!.volume / (priorVolumes.reduce((sum, b) => sum + b.volume, 0) / 20)
      : null;
  return {
    price: validPrice ? price : null,
    change,
    today: !fallback && validPrice && !q.stale && day(at) === day(now),
    asOf,
    session: fallback ? "Settled daily close" : q.session,
    stale: q.stale,
    priceBasis:
      reference?.basis ?? (validPrice ? "older-quote" : "unavailable"),
    priceSource: fallback
      ? (r.historySource ?? "Daily price history")
      : q.source,
    changeFrom: previous?.time ?? null,
    headlines: coverage,
    earnings,
    earningsStatus:
      r.company.assetType === "crypto"
        ? "Not applicable to crypto"
        : earnings
          ? "Unreported scheduled earnings"
          : r.evidence
            ? "No upcoming earnings date supplied"
            : "Earnings calendar unavailable",
    relativeVolume: volume,
    volumeDate: last?.time ?? null,
    volumeStatus: !last
      ? "Settled daily volume unavailable"
      : !volumeRecent
        ? "Daily volume history is older than 10 days"
        : priorVolumes.length < 20
          ? "Requires 20 prior daily volumes"
          : !volumeReady
            ? "Daily volume observations incomplete"
            : "Latest settled volume vs 20 prior sessions",
    verifiedCause: null,
  };
}
