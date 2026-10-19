import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { eodEnabled, eodNews, eodRequest } from "@/lib/eodhd";
import { eodTicker } from "@/lib/eodhd-normalize";
import {
  calendarHighlights,
  newsHighlights,
  type HomeFeed,
} from "@/lib/home-feed";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`home-feed:${user.id}`, 6);
    const query=new URL(request.url).searchParams;
    const kind=query.get("kind")||"all";
    if(!["all","events","news"].includes(kind))throw new HttpError("Invalid update category.");
    const raw = query.get("symbols") ?? "";
    const symbols = [...new Set(raw.split(",").filter(Boolean))];
    if (
      symbols.length > 30 ||
      symbols.some((s) => !/^[A-Z][A-Z0-9.-]{0,14}$/.test(s))
    )
      throw new HttpError("Select up to 30 stock symbols.");
    const now = new Date(),
      retrievedAt = now.toISOString(),
      from = retrievedAt.slice(0, 10),
      to = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const result: HomeFeed = {
      events: [],
      news: [],
      issues: [],
      retrievedAt,
      followed: symbols.length,
      newsFollowed: kind==="events"?0:symbols.length,
    };
    if (!symbols.length) return privateJson(result);
    if (!eodEnabled())
      return privateJson({
        ...result,
        issues: ["Company updates are not connected."],
      });
    const params = {
      symbols: [...symbols].sort().map(eodTicker).join(","),
      from,
      to,
    };
    const [earnings, splits, ...news] = await Promise.allSettled([
      kind!=="news"?eodRequest("calendar/earnings", params, 21600000):Promise.resolve(null),
      kind!=="news"?eodRequest("calendar/splits", params, 21600000):Promise.resolve(null),
      ...(kind!=="events"?symbols.map((s) => eodNews(s)):[]),
    ]);
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
