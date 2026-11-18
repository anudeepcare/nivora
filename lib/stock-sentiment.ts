const object = (x: unknown): Record<string, unknown> | null =>
  x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
const number = (x: unknown, min = -Infinity, max = Infinity) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max
    ? x
    : null;
const text = (x: unknown, n = 300) =>
  typeof x === "string" ? x.slice(0, n) : "";
const direction = (x: unknown) =>
  ["Bullish", "Neutral", "Bearish"].includes(String(x)) ? String(x) : null;
/** Dedicated explicit sentiment projection. Never used as a valuation or trade signal. */
export function stockSentiment(raw: unknown, symbol: string, now = Date.now()) {
  const e = object(raw),
    d = object(e?.data);
  if (
    !e ||
    typeof e.isPreview !== "boolean" ||
    !d ||
    d.ticker !== symbol ||
    !/^[A-Z0-9.-]{1,24}$/.test(symbol)
  )
    return null;
  let asOf: string | null = null;
  if (d.asOf != null) {
    if (
      typeof d.asOf !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d.asOf) ||
      !Number.isFinite(Date.parse(d.asOf)) ||
      new Date(d.asOf).toISOString().slice(0, 10) !== d.asOf ||
      Date.parse(d.asOf) > now
    )
      return null;
    asOf = d.asOf;
  }
  const numeric = (x: unknown, min = -Infinity, max = Infinity) =>
    e.isPreview ? null : number(x, min, max);
  const count = (x: unknown) =>
    Number.isSafeInteger(x) ? numeric(x, 0) : null;
  const array = (x: unknown) => (Array.isArray(x) ? x : []);
  const history = array(d.scoreSparkline);
  const validHistory = history.every((x) => number(x) !== null);
  return {
    symbol,
    asOf,
    isPreview: e.isPreview,
    score: numeric(d.sentisenseScore),
    scoreStatus:
      numeric(d.sentisenseScore) !== null
        ? "available"
        : !e.isPreview && d.sentisenseScore === null
          ? "pending"
          : "unavailable",
    average30d: numeric(d.sentisenseScoreAvg30d),
    change30d: numeric(d.sentisenseScoreDelta30d),
    thinToday:
      typeof d.sentisenseScoreThinSample === "boolean"
        ? d.sentisenseScoreThinSample
        : null,
    thin30d:
      typeof d.sentisenseScoreAvg30dThinSample === "boolean"
        ? d.sentisenseScoreAvg30dThinSample
        : null,
    direction: direction(d.direction),
    latestDirection:
      numeric(d.sentisenseScore) === null ? null : direction(d.latestDirection),
    scoreLabel: [
      "Strong Bearish",
      "Bearish",
      "Slightly Bearish",
      "Neutral",
      "Slightly Bullish",
      "Bullish",
      "Strong Bullish",
    ].includes(String(d.scoreLabel))
      ? String(d.scoreLabel)
      : null,
    trend: ["UP", "DOWN", "FLAT"].includes(String(d.trend))
      ? String(d.trend)
      : null,
    history:
      !e.isPreview && validHistory ? (history.slice(-90) as number[]) : [],
    historyLimited: history.length > 90,
    historyInvalid: !validHistory,
    mentions: count(d.mentions),
    mentionsAverage30d: numeric(d.mentionsAvg30d, 0),
    socialDominance: numeric(d.socialDominance, 0, 1),
    sources: array(d.bySource)
      .slice(0, 20)
      .flatMap((x) => {
        const r = object(x);
        return r && typeof r.source === "string"
          ? [
              {
                source: text(r.source, 80),
                direction: direction(r.direction),
                share: numeric(r.mentionShare, 0, 100),
                polarity: numeric(r.value, -1, 1),
              },
            ]
          : [];
      }),
    drivers: array(d.drivers)
      .slice(0, 8)
      .flatMap((x) => {
        const r = object(x);
        return r && typeof r.title === "string"
          ? [{ title: text(r.title), tone: numeric(r.tone, -1, 1) }]
          : [];
      }),
    peers: array(d.relatedTickers)
      .slice(0, 12)
      .flatMap((x) => {
        const r = object(x);
        return r &&
          typeof r.ticker === "string" &&
          /^[A-Z0-9.-]{1,24}$/.test(r.ticker)
          ? [{ symbol: r.ticker, name: text(r.name, 120) }]
          : [];
      }),
    narrative: text(d.narrative, 1500),
    faq: array(d.faq)
      .slice(0, 6)
      .flatMap((x) => {
        const r = object(x);
        return r &&
          typeof r.question === "string" &&
          typeof r.answer === "string"
          ? [{ question: text(r.question, 200), answer: text(r.answer, 1000) }]
          : [];
      }),
  };
}
export type StockSentimentData = NonNullable<ReturnType<typeof stockSentiment>>;
