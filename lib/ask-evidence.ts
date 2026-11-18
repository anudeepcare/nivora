import type { Evidence } from "./report";
import type { SentiSenseDataset, SentiSenseResult } from "./sentisense-api";
import type { EodNews } from "./eodhd";
export const askTopics = {
  news: {
    match: /\b(news|headlines?|stories|publications?)\b/i,
    feature: "news",
    dataset: "tickerStories",
  },
  earnings: {
    match: /\b(earnings|results|quarter|guidance)\b/i,
    feature: "news",
    dataset: "earnings",
  },
  ownership: {
    match: /\b(owners?|ownership|holders?|institutions?|institutional)\b/i,
    feature: "advanced",
    dataset: "holders",
  },
  analysts: {
    match: /\b(analysts?|consensus|price targets?)\b/i,
    feature: "analysts",
    dataset: "consensus",
  },
  analystChanges: {
    match:
      /\b(upgrades?|downgrades?|analysts? (?:upgrades?|downgrades?|actions?|changes?|initiations?)|coverage initiations?)\b/i,
    feature: "analysts",
    dataset: "analystActions",
  },
  options: {
    match:
      /\b(options?|volatility|open interest|put\/?call|call volume|put volume|puts?)\b/i,
    feature: "options",
    dataset: "options",
  },
} as const;
export type AskTopic = keyof typeof askTopics;
/** Bounded lexical planner: explicit focus first, otherwise request order. No inferred company resolution. */
export function selectedAskTopics(question: string): AskTopic[] {
  // Negate only directly named topic phrases, never the rest of a sentence.
  const topicPhrase = Object.values(askTopics)
    .map(({ match }) => `(?:${match.source})`)
    .sort((a, b) => b.length - a.length)
    .join("|");
  const negative = new RegExp(
    `\\b(?:not|no|excluding|exclude|ignore|skip|without)\\s+(?!only\\b)(?:${topicPhrase})(?:\\s+(?:and|or)\\s+(?:${topicPhrase}))*`,
    "gi",
  );
  const scoped = question.replace(negative, (match) =>
    " ".repeat(match.length),
  );
  const focus =
    /\b(?:focus on|prioriti[sz]e|mainly|primarily|especially)\s+(?:the\s+)?/gi;
  const focusList = new RegExp(
    `^(?:${topicPhrase})(?:\\s+(?:and|or)\\s+(?:${topicPhrase}))*`,
    "i",
  );
  const focusRanges = [...scoped.matchAll(focus)].flatMap((match) => {
    const start = match.index! + match[0].length;
    const list = focusList.exec(scoped.slice(start));
    return list ? [{ start, end: start + list[0].length }] : [];
  });
  const matches = (Object.keys(askTopics) as AskTopic[]).flatMap((topic) => {
    const pattern =
      topic === "analysts" && askTopics.analystChanges.match.test(scoped)
        ? /\b(consensus|price targets?|targets?)\b/i
        : askTopics[topic].match;
    const occurrences = [...scoped.matchAll(new RegExp(pattern.source, "gi"))];
    if (!occurrences.length) return [];
    const focused = occurrences.find((match) =>
      focusRanges.some(
        ({ start, end }) => match.index! >= start && match.index! < end,
      ),
    );
    return [
      { topic, index: (focused ?? occurrences[0]).index!, focus: !!focused },
    ];
  });
  return matches
    .sort((a, b) => Number(b.focus) - Number(a.focus) || a.index - b.index)
    .map((m) => m.topic);
}
export type AskEvidencePlan = {
  symbol: string;
  topics: AskTopic[];
  omitted: AskTopic[];
  limitations: string[];
  error: string | null;
};
export function askEvidencePlan(
  question: string,
  symbol: string,
): AskEvidencePlan {
  const explicit = [...question.matchAll(/\$([A-Z][A-Z0-9.-]{0,14})\b/gi)].map(
    (m) => m[1].toUpperCase(),
  );
  const error = !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)
    ? "Select one supported company before asking a question."
    : explicit.some((s) => s !== symbol)
      ? "This question names another ticker. Open that company or ask about the selected company only."
      : /\b(?:my|our) (?:portfolio|holdings|account)|\b(?:all stocks|all companies|whole market|entire market|market-wide)\b/i.test(
            question,
          )
        ? "This Ask view retrieves evidence for one selected company, not private holdings or the whole market."
        : null;
  const requested = selectedAskTopics(question),
    topics = error ? [] : requested.slice(0, 2),
    omitted = error ? [] : requested.slice(2);
  return {
    symbol,
    topics,
    omitted,
    error,
    limitations: [
      `Evidence subject: ${symbol || "not selected"}. Topic routing uses bounded text matches, not unrestricted research or company-name resolution.`,
      topics.length
        ? `Selected additional evidence: ${topics.join(", ")}; explicit focus takes precedence, then question order.`
        : "No supported extra topic was identified; only existing dated financial evidence is considered.",
      ...(omitted.length
        ? [
            `Not retrieved in this answer: ${omitted.join(", ")}. Ask separately to keep retrieval bounded.`,
          ]
        : []),
    ],
  };
}
const object = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
const text = (x: unknown, max = 1000) =>
  typeof x === "string" ? x.replace(/[\u0000-\u001f]/g, " ").slice(0, max) : "";
const number = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) ? x : null;
function day(x: unknown, now: string) {
  if (typeof x !== "string") return null;
  const d = x.slice(0, 10);
  if (
    x.length > 10 &&
    (!Number.isFinite(Date.parse(x)) || Date.parse(x) > Date.parse(now))
  )
    return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    Number.isFinite(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d &&
    d <= now.slice(0, 10)
    ? d
    : null;
}
function https(x: unknown) {
  try {
    const u = new URL(String(x));
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
/** Only fixed company endpoints receive the ticker. Questions/portfolio context never leave for market providers. */
export async function askTopicEvidence(
  symbol: string,
  topics: AskTopic[],
  deps: {
    read: (
      symbol: string,
      dataset: SentiSenseDataset,
    ) => Promise<SentiSenseResult>;
    news: (symbol: string) => Promise<EodNews>;
    now: () => string;
    signal?: AbortSignal;
  },
) {
  const evidence: Evidence[] = [];
  const limitations: string[] = [];
  deps.signal?.throwIfAborted();
  const selected = topics.slice(0, 2);
  if (topics.length > 2)
    limitations.push(
      "Only the first two requested topics were retrieved. Ask a separate question for the remaining topics.",
    );
  if (!selected.length) return { evidence, limitations };
  limitations.push(
    `Requested topic scope: ${selected.join(", ")}. Provider documentation links identify the feed, not original filing or article links unless supplied.`,
  );
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) {
    limitations.push(
      "Additional company evidence requires a supported stock ticker.",
    );
    return { evidence, limitations };
  }
  let profile: SentiSenseResult;
  try {
    deps.signal?.throwIfAborted();
    profile = await deps.read(symbol, "profile");
  } catch {
    limitations.push(
      "Stock identity could not be verified; additional topic evidence was not retrieved.",
    );
    return { evidence, limitations };
  }
  if (
    profile.dataset !== "profile" ||
    profile.symbol !== symbol ||
    profile.status !== "available" ||
    profile.isPreview ||
    object(profile.data).kind !== "STOCK"
  ) {
    limitations.push(
      `Stock identity is not verified (${profile.status}); additional topic evidence was not retrieved.`,
    );
    return { evidence, limitations };
  }
  const add = (
    topic: AskTopic,
    label: string,
    value: number | null,
    unit: string,
    period: string | null,
    filed: string | null,
    url: string,
    passage?: string,
  ) => {
    if (
      !period ||
      !filed ||
      (!passage && value === null) ||
      evidence.filter((e) => e.id.startsWith(`T-${topic}-`)).length >= 8
    )
      return;
    evidence.push({
      id: `T-${topic}-${evidence.length + 1}`,
      label,
      value,
      unit,
      period,
      filed,
      url,
      ...(passage ? { passage } : {}),
    });
  };
  deps.signal?.throwIfAborted();
  const publisherNews = selected.includes("news")
    ? deps.news(symbol).catch(() => null)
    : null;
  await Promise.all(
    selected.map(async (topic) => {
      const dataset = askTopics[topic].dataset;
      let r: SentiSenseResult;
      try {
        deps.signal?.throwIfAborted();
        r = await deps.read(symbol, dataset);
      } catch {
        limitations.push(
          `${topic}: source unavailable; no claim of complete coverage.`,
        );
        return;
      }
      const now = deps.now();
      if (
        r.dataset !== dataset ||
        r.symbol !== symbol ||
        r.status !== "available" ||
        r.isPreview
      ) {
        limitations.push(
          `${topic}: ${r.symbol !== symbol ? "subject mismatch" : r.status}; preview or unavailable evidence was not used.`,
        );
        return;
      }
      if (
        [r.retrievedAt, r.asOf].some(
          (value) =>
            typeof value === "string" &&
            value.includes("T") &&
            (!Number.isFinite(Date.parse(value)) ||
              Date.parse(value) > Date.parse(now)),
        )
      ) {
        limitations.push(
          `${topic}: invalid or future source timestamp; evidence withheld.`,
        );
        return;
      }
      const d = object(r.data),
        filed = day(r.retrievedAt, now),
        asOf = day(r.asOf, now);
      const url = `https://sentisense.ai/docs/api/${topic === "analysts" || topic === "analystChanges" ? "analyst-ratings" : topic === "ownership" ? "institutional-flows" : topic === "options" ? "options" : topic === "news" ? "documents" : "stocks"}/`;
      const before = evidence.filter((e) =>
        e.id.startsWith(`T-${topic}-`),
      ).length;
      if (
        topic === "options" &&
        (!asOf || Date.parse(now) - Date.parse(asOf) > 3 * 86400000)
      ) {
        limitations.push(
          "options: observation is undated or older than three days; figures withheld.",
        );
        return;
      }
      if (
        topic === "analysts" &&
        (!asOf || Date.parse(now) - Date.parse(asOf) > 90 * 86400000)
      ) {
        limitations.push(
          "analysts: observation is undated or older than ninety days; figures withheld.",
        );
        return;
      }
      if (topic === "news")
        limitations.push(
          "Story titles are provider-generated editorial summaries. Undated stories are withheld; cluster assembly time is not treated as the story event date.",
        );
      if (topic === "news" && Array.isArray(r.data))
        for (const item of r.data.slice(0, 8)) {
          const row = object(item),
            cluster = object(row.cluster);
          if (!Array.isArray(row.tickers) || !row.tickers.includes(symbol))
            continue;
          const epoch = number(row.brokeAt);
          const date =
            epoch !== null && epoch > 0 && epoch < 8640000000000
              ? day(new Date(epoch * 1000).toISOString(), now)
              : null;
          add(
            topic,
            "Provider-generated story title (not independently verified)",
            null,
            "headline only",
            date,
            filed,
            url,
            text(cluster.title, 400),
          );
        }
      if (topic === "earnings" && Array.isArray(r.data))
        for (const item of r.data.slice(0, 4)) {
          const row = object(item);
          add(
            topic,
            "Earnings report summary",
            null,
            "supplied narrative",
            day(row.reportDate, now),
            filed,
            url,
            text(row.summaryMd) || text(row.headline),
          );
        }
      if (topic === "ownership") {
        const date = day(d.reportDate, now);
        for (const item of (Array.isArray(d.holders) ? d.holders : []).slice(
          0,
          8,
        )) {
          const row = object(item);
          const shares = number(row.shares);
          if (shares !== null && shares >= 0)
            add(
              topic,
              `Reported holding · ${text(row.filerName, 100)}`,
              shares,
              "shares",
              date,
              filed,
              url,
            );
        }
        limitations.push(
          "Ownership is a returned filing subset, not a complete ownership register or evidence of conviction.",
        );
      }
      if (topic === "analystChanges" && Array.isArray(r.data)) {
        for (const item of r.data.slice(0, 50)) {
          const row = object(item),
            date = day(row.actionDate, now),
            firm = text(row.firm, 100),
            action = text(row.actionType, 40);
          if (
            !date ||
            Date.parse(now) - Date.parse(date) > 90 * 86400000 ||
            !firm ||
            ![
              "UPGRADE",
              "DOWNGRADE",
              "INITIATE",
              "REITERATE",
              "OTHER",
            ].includes(action) ||
            (row.ticker !== undefined && row.ticker !== symbol)
          )
            continue;
          const previous = text(row.fromGrade, 100),
            next = text(row.toGrade, 100);
          add(
            topic,
            "Published analyst action",
            null,
            "attributed rating text",
            date,
            filed,
            url,
            `${firm}: ${action}${previous ? `; previous rating: ${previous}` : ""}${next ? `; published rating: ${next}` : ""}`,
          );
        }
        limitations.push(
          "Analyst actions are a bounded published-note subset, not consensus changes or company recommendations. Target amounts are not used in this action view; missing currency or split basis is not inferred.",
        );
      }
      if (topic === "analysts") {
        const currency =
          typeof d.currency === "string" && /^[A-Z]{3}$/.test(d.currency)
            ? d.currency
            : null;
        for (const field of ["targetLow", "targetMean", "targetHigh"]) {
          const v = number(d[field]);
          if (currency && v !== null && v >= 0)
            add(
              topic,
              `Analyst ${field} · not modeled valuation`,
              v,
              currency,
              asOf,
              filed,
              url,
            );
        }
        const count = number(d.numberOfAnalysts);
        if (count !== null && Number.isInteger(count) && count >= 0)
          add(
            topic,
            "Target-publishing analysts",
            count,
            "analysts",
            asOf,
            filed,
            url,
          );
        if (!currency)
          limitations.push(
            "Analyst target currency not supplied; target amounts withheld, never inferred from listing currency.",
          );
      }
      if (topic === "options") {
        const latest = object(d.latest);
        for (const [field, unit] of [
          ["callVol", "contracts"],
          ["putVol", "contracts"],
          ["pcVol", "put/call volume ratio"],
          ["atmIv", "annualized fraction"],
        ] as const) {
          const v = number(latest[field] ?? d[field]);
          if (v !== null && v >= 0)
            add(topic, field, v, unit, asOf, filed, url);
        }
        limitations.push(
          "Options observations are dated summaries, not a full chain, dealer gamma, trade direction or executable quotes.",
        );
      }
      if (
        evidence.filter((e) => e.id.startsWith(`T-${topic}-`)).length === before
      )
        limitations.push(
          `${topic}: no eligible dated observations were supplied.`,
        );
    }),
  );
  if (selected.includes("news"))
    try {
      const feed = await publisherNews;
      if (!feed) throw new Error("Publisher feed unavailable");
      const now = deps.now();
      for (const row of feed.items.slice(0, 4)) {
        const url = https(row.url);
        if (url)
          add(
            "news",
            "Publisher headline",
            null,
            "headline only",
            day(row.date, now),
            day(feed.retrievedAt, now),
            url,
            text(row.title, 400),
          );
      }
      limitations.push(
        "News evidence contains headlines only; article bodies and causal explanations were not retrieved.",
      );
    } catch {
      limitations.push("Additional publisher headlines unavailable.");
    }
  limitations.push(
    "Provider retrieval dates are checks, not proof of publication freshness. Dated historical evidence may be old; no live-state inference.",
  );
  return { evidence, limitations };
}
