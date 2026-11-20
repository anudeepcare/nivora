import { marketDay } from "./home-feed.ts";
import type { MarketEvent, MarketHeadline } from "./home-feed";

type Input = {
  day: string;
  now: string;
  reports: MarketEvent[];
  headlines: MarketHeadline[];
  checkpoints: MarketEvent[];
  marketHeadlines?: MarketHeadline[];
};

const dayMs = 86_400_000;
const dateOnly = (date: string) => {
  const timestamp = Date.parse(date);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === date
    ? timestamp
    : NaN;
};

function headlinePrompt(title: string, market: boolean) {
  if (market) {
    const subject =
      /\b(?:federal reserve|fed (?:rates?|decision|minutes)|inflation|CPI|PCE|jobs report|nonfarm payrolls|GDP)\b/i;
    const evidence =
      /\b(?:data|figures|reading|release|report|print|decision|minutes|rates?|cuts?|hikes?|accelerates?|slows?|rises?|falls?|jumps?|drops?|holds?|forecast)\b/i;
    return subject.test(title) && evidence.test(title)
      ? {
          rank: 5,
          why: "A broad economic release or policy decision can shift expectations beyond a single company.",
          question:
            "What does the official scheduled release or actual decision say, and how does it compare with expectations?",
        }
      : null;
  }
  if (
    /\b(?:10-[QK]|8-K|files?\s+(?:its\s+|an?\s+)?(?:quarterly|annual|regulatory)\s+report)\b/i.test(
      title,
    )
  )
    return {
      rank: 6,
      why: "A filing can separate what the company disclosed from the market reaction.",
      question:
        "Which figure or risk in the filing changes the earlier assumptions?",
    };
  if (
    /\b(?:raises?|lowers?|cuts?|updates?|reaffirms?|withdraws?)\b.{0,45}\b(?:guidance|outlook|forecast)\b/i.test(
      title,
    )
  )
    return {
      rank: 4,
      why: "An outlook change matters if it alters expectations for future results.",
      question:
        "What changed from the previous outlook: sales, margins, or timing?",
    };
  if (
    /\b(?:reports?|posts?|releases?|publishes?)\b.{0,55}\b(?:earnings|quarterly results|financial results)\b/i.test(
      title,
    )
  )
    return {
      rank: 4,
      why: "Reported results can test the expectations already reflected in the price.",
      question:
        "Does the company release show a change in revenue or cash generation?",
    };
  if (
    /\b(?:announces?|signs?|wins?|launches?)\b.{0,45}\b(?:contract|acquisition|partnership|product|approval)\b/i.test(
      title,
    )
  )
    return {
      rank: 3,
      why: "An announcement matters more when the company discloses its timing and economics.",
      question:
        "Does the company disclose a financial impact, or only the announcement?",
    };
  return null;
}

/** Select only dated observations. Headline wording is quoted, not summarized. */
export function todayNarrative({
  day,
  now,
  reports,
  headlines,
  checkpoints,
  marketHeadlines = [],
}: Input) {
  const start = dateOnly(day),
    time = Date.parse(now);
  if (!Number.isFinite(start) || !Number.isFinite(time)) return null;
  const nextFor = (symbol: string) =>
    checkpoints
      .filter((event) => {
        const at = dateOnly(event.date);
        return (
          event.symbol === symbol &&
          at >= start &&
          at <= start + 7 * dayMs &&
          !reports.some(
            (reported) =>
              reported.symbol === event.symbol &&
              reported.date === event.date &&
              reported.kind === event.kind &&
              typeof reported.actual === "number" &&
              Number.isFinite(reported.actual),
          )
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const report = reports
    .filter((event) => {
      const at = dateOnly(event.date);
      return (
        /earnings/i.test(event.kind) &&
        at >= start - 7 * dayMs &&
        at <= start &&
        typeof event.actual === "number" &&
        Number.isFinite(event.actual)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const rank = (quality: number, observedDay: number) =>
    quality - (start - observedDay) / dayMs;
  const rankedHeadlines = (
    items: MarketHeadline[],
    scope: "market" | "company",
  ) =>
    items.flatMap((headline) => {
      const at = Date.parse(headline.date);
      if (
        !headline.title.trim() ||
        !Number.isFinite(at) ||
        at > time ||
        at < time - 7 * dayMs
      )
        return [];
      try {
        const url = new URL(headline.url);
        if (
          !["https:", "http:"].includes(url.protocol) ||
          url.username ||
          url.password
        )
          return [];
        const prompt = headlinePrompt(headline.title, scope === "market");
        const observedDay = dateOnly(
          dateOnly(headline.date) === at ? headline.date : marketDay(at),
        );
        if (!prompt || !Number.isFinite(observedDay) || observedDay > start)
          return [];
        return [
          {
            headline,
            scope,
            at,
            observedDay,
            score: rank(prompt.rank, observedDay),
            source: url.hostname.replace(/^www\./, ""),
            why: prompt.why,
            question: prompt.question,
          },
        ];
      } catch {
        return [];
      }
    });
  const selected = [
    ...rankedHeadlines(headlines, "company"),
    ...rankedHeadlines(marketHeadlines, "market"),
  ].sort(
    (a, b) => b.score - a.score || b.observedDay - a.observedDay || b.at - a.at,
  )[0];
  // Recency competes with evidence strength. A comparable dated result gets
  // priority without reserving the lead for company data indefinitely.
  if (report) {
    const reportDay = dateOnly(report.date);
    const score = rank(7, reportDay);
    if (
      !selected ||
      score > selected.score ||
      (score === selected.score && reportDay >= selected.observedDay)
    )
      return {
        kind: "report" as const,
        scope: "company" as const,
        report,
        next: nextFor(report.symbol),
        why: "A reported result gives you a concrete reason to revisit earlier expectations.",
        question:
          "What explains the reported EPS in the company release: operations or one-time items?",
      };
  }
  return selected
    ? {
        kind: "headline" as const,
        scope: selected.scope,
        headline: selected.headline,
        source: selected.source,
        why: selected.why,
        question: selected.question,
        next:
          selected.scope === "company"
            ? nextFor(selected.headline.symbol)
            : null,
      }
    : null;
}
