import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { eodEnabled, eodNews, eodRequest } from "@/lib/eodhd";
import { eodTicker } from "@/lib/eodhd-normalize";
import {
  calendarHighlights,
  newsHighlights,
  settledFeedMap,
  marketDay,
  type HomeFeed,
} from "@/lib/home-feed";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    // Sequential 30-symbol batches can cover a large account without a six-call cutoff.
    limit(`home-feed:${user.id}`, 30);
    const query = new URL(request.url).searchParams;
    const kind = query.get("kind") || "all";
    if (!["all", "events", "news"].includes(kind))
      throw new HttpError("Invalid update category.");
    const raw = query.get("symbols") ?? "";
    const symbols = [...new Set(raw.split(",").filter(Boolean))];
    if (
      symbols.length > 30 ||
      symbols.some((s) => !/^[A-Z][A-Z0-9.-]{0,14}$/.test(s))
    )
      throw new HttpError("Select up to 30 stock symbols.");
    const now = new Date(),
      retrievedAt = now.toISOString(),
      from = marketDay(retrievedAt),
      to = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const result: HomeFeed = {
      events: [],
      news: [],
      issues: [],
      retrievedAt,
      followed: symbols.length,
      newsFollowed: 0,
      eventsReady: kind !== "news",
      newsReady: kind !== "events",
    };
    if (!symbols.length) return privateJson(result);
    if (!eodEnabled())
      return privateJson({
        ...result,
        issues: ["Company updates are not connected."],
        eventsReady: false,
        newsReady: false,
        followed: 0,
      });
    const params = {
      symbols: [...symbols].sort().map(eodTicker).join(","),
      from,
      to,
    };
    const [calendar, news] = await Promise.all([
      Promise.allSettled([
        kind !== "news"
          ? eodRequest("calendar/earnings", params, 300000)
          : Promise.resolve(null),
        kind !== "news"
          ? eodRequest("calendar/splits", params, 21600000)
          : Promise.resolve(null),
      ]),
      settledFeedMap(kind !== "events" ? symbols : [], (symbol) =>
        eodNews(symbol),
      ),
    ]);
    const [earnings, splits] = calendar;
    result.eventsReady =
      kind !== "news" && calendar.every((row) => row.status === "fulfilled");
    result.newsReady =
      kind !== "events" && news.every((row) => row.status === "fulfilled");
    result.newsFollowed = news.filter(
      (row) => row.status === "fulfilled",
    ).length;
    result.events = calendarHighlights(
      earnings.status === "fulfilled" ? earnings.value : null,
      splits.status === "fulfilled" ? splits.value : null,
      symbols,
      from,
      to,
    );
    result.news = newsHighlights(
      news.flatMap((r, i) =>
        r.status === "fulfilled"
          ? [{ symbol: symbols[i], items: r.value.items }]
          : [],
      ),
      retrievedAt,
    );
    if (earnings.status === "rejected" || splits.status === "rejected")
      result.issues.push("Some scheduled events could not be checked.");
    if (news.some((r) => r.status === "rejected"))
      result.issues.push("Some news coverage is temporarily unavailable.");
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
