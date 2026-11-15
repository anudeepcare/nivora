import type { EodNews } from "./eodhd";
import { relevantHoldingHeadlines } from "./home-feed.ts";
export type DeskArticle = EodNews["items"][number] & { source: string };
/** Organizes supplied headlines, not their meaning or effect on a stock. */
export function newsDesk(
  items: EodNews["items"],
  symbol: string,
  name: string,
  now: number,
): { company: DeskArticle[]; broader: DeskArticle[] } {
  if (!Number.isFinite(now)) return { company: [], broader: [] };
  const urls = new Set<string>();
  const titles = new Set<string>();
  const clean = items
    .filter(
      (item) =>
        Number.isFinite(Date.parse(item.date)) &&
        Date.parse(item.date) <= now &&
        item.title.trim(),
    )
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .flatMap((item) => {
      try {
        const url = new URL(item.url);
        if (url.protocol !== "https:" || url.username || url.password)
          return [];
        url.hash = "";
        for (const key of [...url.searchParams.keys()])
          if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
        const title = item.title
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, " ")
          .trim();
        if (urls.has(url.href) || titles.has(title)) return [];
        urls.add(url.href);
        titles.add(title);
        return [{ ...item, source: url.hostname.replace(/^www\./, "") }];
      } catch {
        return [];
      }
    });
  const matched = new Set(
    relevantHoldingHeadlines(
      clean.map((item) => ({ ...item, symbol })),
      { [symbol]: name },
      new Map(),
    ).map((item) => item.url),
  );
  return {
    company: clean.filter((item) => matched.has(item.url)),
    broader: clean.filter((item) => !matched.has(item.url)),
  };
}
