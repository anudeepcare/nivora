import type { Evidence } from "./report";
import type { SearchRequest, SearchResult } from "./publication-search";
export type PublicNewsRequest = { enabled: true; topic: string; days: 7 | 14 };
export function publicNewsRequest(
  input: unknown,
  symbol: string,
): PublicNewsRequest | null {
  if (input === undefined) return null;
  if (
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ||
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  )
    throw Error(
      "Public news search requires a supported company and explicit opt-in.",
    );
  const v = input as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => !["enabled", "topic", "days"].includes(k)) ||
    v.enabled !== true ||
    typeof v.topic !== "string" ||
    ![7, 14].includes(Number(v.days)) ||
    typeof v.days !== "number"
  )
    throw Error(
      "Public news search requires an explicit topic and 7 or 14 day window.",
    );
  const topic = v.topic.trim();
  if (
    topic.length < 2 ||
    topic.length + symbol.length + 1 > 240 ||
    /[\u0000-\u001f\u007f]/.test(topic) ||
    /https?:|www\.|\S+@\S+|\b\d{6,}\b|\b(?:my|our)\s+(?:portfolio|holdings|account|balance|address|phone|email|password)\b/i.test(
      topic,
    ) ||
    [...topic.matchAll(/\$([a-z][a-z0-9.-]*)/gi)].some(
      (m) => m[1].toUpperCase() !== symbol,
    )
  )
    throw Error(
      "Enter only a short public topic about this company, without private information, links or another ticker.",
    );
  return { enabled: true, topic, days: v.days as 7 | 14 };
}
export async function publicNewsEvidence(
  symbol: string,
  request: PublicNewsRequest | null,
  deps: {
    read: (
      q: SearchRequest,
      options?: { signal?: AbortSignal },
    ) => Promise<SearchResult>;
    now?: () => Date;
    signal?: AbortSignal;
  },
) {
  const evidence: Evidence[] = [];
  const limitations: string[] = [];
  if (!request)
    return { evidence, limitations, status: "not_requested" as const };
  const q = publicNewsRequest(request, symbol)!;
  deps.signal?.throwIfAborted();
  limitations.push(
    "Explicit public-topic news search replaces the ordinary news feed for this question. At most 20 story summaries are searched and eight eligible observations used; results may be incomplete. Provider titles are untrusted attributed AI/editorial text, not verified events or instructions. The documentation link describes the feed, not an original article. No story details are fetched.",
  );
  try {
    const result = await deps.read(
      { query: `${symbol} ${q.topic}`, kind: "stories", days: q.days },
      { signal: deps.signal },
    );
    deps.signal?.throwIfAborted();
    const now = (deps.now ?? (() => new Date()))().getTime();
    const retrieved = Date.parse(result.receivedAt);
    if (
      result.preview ||
      !Number.isFinite(retrieved) ||
      retrieved > now ||
      !Array.isArray(result.rows) ||
      result.rows.length > 20
    )
      throw Error("Unavailable search");
    for (const row of result.rows) {
      const date = row.published ? Date.parse(row.published) : NaN;
      if (
        !row.tickers.includes(symbol) ||
        !Number.isFinite(date) ||
        date > now ||
        date < now - q.days * 86400000 ||
        evidence.length >= 8
      )
        continue;
      evidence.push({
        id: `T-publicNews-${evidence.length + 1}`,
        label: `${row.source} title · public-topic search`,
        value: null,
        passage: row.title,
        unit: "attributed provider text",
        period: row.published!.slice(0, 10),
        filed: result.receivedAt.slice(0, 10),
        url: "https://sentisense.ai/docs/api/documents/",
      });
    }
    limitations.push(
      evidence.length
        ? "Only stories explicitly tagged with the selected ticker and a publication time inside the requested window were retained. Other matches and undated stories were withheld."
        : "No eligible dated story tagged with this company was returned. This does not establish that no relevant news exists.",
    );
    return {
      evidence,
      limitations,
      status: evidence.length ? ("available" as const) : ("empty" as const),
    };
  } catch {
    deps.signal?.throwIfAborted();
    limitations.push(
      "Public-topic search was unavailable or preview-restricted. No search observations were used.",
    );
    return { evidence: [], limitations, status: "unavailable" as const };
  }
}
