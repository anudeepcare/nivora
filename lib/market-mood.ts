export const moodKinds = ["mood", "sectors", "breadth"] as const;
export type MoodKind = (typeof moodKinds)[number];
type Metric = number | null;
export type MoodPoint = { date: string; score: Metric };
export type BreadthPoint = {
  date: string;
  coveredStocks: Metric;
  totalMentions: Metric;
  bullish: Metric;
  neutral: Metric;
  bearish: Metric;
  bullishPct: Metric;
  neutralPct: Metric;
  bearishPct: Metric;
  netBreadth: Metric;
  bullishMentionPct: Metric;
  neutralMentionPct: Metric;
  bearishMentionPct: Metric;
  sentimentDispersion: Metric;
};
export type MoodSnapshot = {
  kind: MoodKind;
  status: "available" | "preview" | "no-coverage";
  asOf: string | null;
  generatedAt: string | null;
  isPreview: boolean;
  partial: boolean;
  mood?: {
    score: Metric;
    phase: string;
    weeklyChange: Metric;
    history: MoodPoint[];
    signals: { key: string; label: string; value: Metric; change: Metric }[];
    sectors: {
      name: string;
      score: Metric;
      phase: string;
      weeklyChange: Metric;
    }[];
  };
  sectors?: {
    marketConsensusRatio: Metric;
    rows: {
      name: string;
      meanSentiment: Metric;
      meanScore: Metric;
      consensusRatio: Metric;
      consensusVsMarket: Metric;
      stockCount: Metric;
      totalMentions: Metric;
      bullMentions: Metric;
      bearMentions: Metric;
    }[];
  };
  breadth?: {
    minMentions: Metric;
    latest: BreadthPoint | null;
    series: BreadthPoint[];
  };
};
const obj = (x: unknown): Record<string, unknown> | null =>
  x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
const num = (x: unknown, min = -Infinity, max = Infinity): Metric =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max
    ? x
    : null;
const count = (x: unknown): Metric =>
  Number.isSafeInteger(x) && Number(x) >= 0 ? Number(x) : null;
const label = (x: unknown) => (typeof x === "string" ? x.slice(0, 100) : "");
function date(x: unknown, now: number) {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
  const t = Date.parse(x);
  return Number.isFinite(t) &&
    new Date(t).toISOString().slice(0, 10) === x &&
    t <= now
    ? x
    : null;
}
function instant(x: unknown, scale: number, now: number) {
  const n = num(x, 0);
  return n !== null && n * scale <= now && n * scale < 8.64e15
    ? new Date(n * scale).toISOString()
    : null;
}
const keys = [
  "social_sentiment",
  "market_direction",
  "fear_gauge",
  "social_momentum",
  "spy_trend",
  "options_flow",
];
function bucket(value: unknown, now: number): BreadthPoint | null {
  const r = obj(value),
    d = date(r?.date, now);
  if (!r || !d) return null;
  const b: BreadthPoint = {
    date: d,
    coveredStocks: count(r.coveredStocks),
    totalMentions: count(r.totalMentions),
    bullish: count(r.bullish),
    neutral: count(r.neutral),
    bearish: count(r.bearish),
    bullishPct: num(r.bullishPct, 0, 100),
    neutralPct: num(r.neutralPct, 0, 100),
    bearishPct: num(r.bearishPct, 0, 100),
    netBreadth: num(r.netBreadth, -100, 100),
    bullishMentionPct: num(r.bullishMentionPct, 0, 100),
    neutralMentionPct: num(r.neutralMentionPct, 0, 100),
    bearishMentionPct: num(r.bearishMentionPct, 0, 100),
    sentimentDispersion: num(r.sentimentDispersion, 0, 1),
  };
  if (
    b.coveredStocks !== null &&
    b.bullish !== null &&
    b.neutral !== null &&
    b.bearish !== null &&
    b.bullish + b.neutral + b.bearish !== b.coveredStocks
  )
    return null;
  // Stock-weighted percentages must agree with their supplied denominator.
  // Allow rounding to two decimal places, never repair contradictory evidence.
  if (b.coveredStocks !== null) {
    for (const [countKey, pctKey] of [
      ["bullish", "bullishPct"],
      ["neutral", "neutralPct"],
      ["bearish", "bearishPct"],
    ] as const) {
      const n = b[countKey],
        pct = b[pctKey];
      if (n !== null && n > b.coveredStocks) return null;
      if (b.coveredStocks === 0) {
        if (pct !== null && pct !== 0) return null;
      } else if (
        n !== null &&
        pct !== null &&
        Math.abs(pct - (100 * n) / b.coveredStocks) > 0.011
      )
        return null;
    }
  }
  for (const fields of [
    ["bullishPct", "neutralPct", "bearishPct"],
    ["bullishMentionPct", "neutralMentionPct", "bearishMentionPct"],
  ] as const) {
    const values = fields.map((k) => b[k]);
    if (
      values.every((v): v is number => v !== null) &&
      b.coveredStocks !== 0 &&
      Math.abs(values.reduce((a, v) => a + v, 0) - 100) > 0.2
    )
      return null;
  }
  if (
    b.netBreadth !== null &&
    b.bullishPct !== null &&
    b.bearishPct !== null &&
    Math.abs(b.netBreadth - (b.bullishPct - b.bearishPct)) > 0.05
  )
    return null;
  return b;
}
/** Explicit projection only; no narrative, arbitrary fields, URLs or inferred scores. */
export function moodSnapshot(
  raw: unknown,
  kind: MoodKind,
  now = Date.now(),
): MoodSnapshot | null {
  const envelope = obj(raw);
  if (!envelope) return null;
  if (
    Object.hasOwn(envelope, "isPreview") &&
    typeof envelope.isPreview !== "boolean"
  )
    return null;
  const r = obj(envelope.data) ?? envelope;
  if (Object.hasOwn(r, "asOf") && r.asOf != null && !date(r.asOf, now))
    return null;
  if (
    Object.hasOwn(r, "generatedAt") &&
    r.generatedAt != null &&
    !instant(r.generatedAt, 1000, now)
  )
    return null;
  const preview = envelope.isPreview === true;
  const out: MoodSnapshot = {
    kind,
    status: preview ? "preview" : "available",
    asOf: date(r.asOf, now),
    generatedAt: instant(r.generatedAt, 1000, now),
    isPreview: preview,
    partial: false,
  };
  if (kind === "mood") {
    const m = obj(r.market);
    if (!m || !Array.isArray(m.history)) return null;
    const history = m.history
      .flatMap((x) => {
        const row = obj(x),
          d = date(row?.date, now);
        return row &&
          d &&
          (!Object.hasOwn(row, "timestamp") || instant(row.timestamp, 1, now))
          ? [{ date: d, score: num(row.score, 0, 100) }]
          : [];
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    out.partial = history.length !== m.history.length || history.length > 90;
    out.asOf = history.at(-1)?.date ?? null;
    out.mood = {
      score: num(m.currentScore, 0, 100),
      phase: label(m.phase),
      weeklyChange: num(m.weeklyChange, -100, 100),
      history: history.slice(-90),
      signals: (Array.isArray(m.signals) ? m.signals : [])
        .flatMap((x) => {
          const row = obj(x);
          return row && keys.includes(String(row.key))
            ? [
                {
                  key: String(row.key),
                  label: label(row.label),
                  value: num(row.value, 0, 100),
                  change: num(row.change, -100, 100),
                },
              ]
            : [];
        })
        .slice(0, 6),
      sectors: Object.entries(obj(r.sectors) ?? {})
        .slice(0, 11)
        .flatMap(([name, x]) => {
          const row = obj(x);
          return row
            ? [
                {
                  name: label(name),
                  score: num(row.currentScore, 0, 100),
                  phase: label(row.phase),
                  weeklyChange: num(row.weeklyChange, -100, 100),
                },
              ]
            : [];
        }),
    };
    if (!history.length && out.mood.score === null)
      out.status = preview ? "preview" : "no-coverage";
  } else if (kind === "sectors") {
    if (!Array.isArray(r.sectors)) return null;
    const rows = r.sectors.flatMap((x) => {
      const row = obj(x);
      return row && typeof row.sector === "string"
        ? [
            {
              name: label(row.sector),
              meanSentiment: num(row.meanSentiment, -1, 1),
              meanScore: num(row.meanScore),
              consensusRatio: num(row.consensusRatio, -1, 1),
              consensusVsMarket: num(row.consensusVsMarket, -2, 2),
              stockCount: count(row.stockCount),
              totalMentions: count(row.totalMentions),
              bullMentions: count(row.bullMentions),
              bearMentions: count(row.bearMentions),
            },
          ]
        : [];
    });
    out.sectors = {
      marketConsensusRatio: num(r.marketConsensusRatio, -1, 1),
      rows: rows.slice(0, 11),
    };
    out.partial = rows.length !== r.sectors.length || rows.length > 11;
    if (!rows.length) out.status = preview ? "preview" : "no-coverage";
  } else {
    if (!Array.isArray(r.series)) return null;
    const series = r.series
      .map((x) => bucket(x, now))
      .filter((x): x is BreadthPoint => x !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    const latest = bucket(r.latest, now);
    out.breadth = {
      minMentions: count(r.minMentions),
      latest,
      series: series.slice(-90),
    };
    out.partial =
      series.length !== r.series.length ||
      series.length > 90 ||
      (!!r.latest && !latest);
    if (!latest && !series.length)
      out.status = preview ? "preview" : "no-coverage";
  }
  return out;
}
