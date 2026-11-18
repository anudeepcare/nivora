export type EtfAggregateMode = "insider30" | "insider90" | "sentiment";
export function etfAggregateRequest(symbol: unknown, mode: unknown) {
  if (
    typeof symbol !== "string" ||
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ||
    typeof mode !== "string" ||
    !["insider30", "insider90", "sentiment"].includes(mode)
  )
    return null;
  return {
    symbol,
    mode: mode as EtfAggregateMode,
    path: `/${symbol}/aggregates/${mode === "sentiment" ? "sentiment" : `insider?lookbackDays=${mode === "insider30" ? 30 : 90}`}`,
  };
}
const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const text = (v: unknown, max = 200): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const num = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const count = (v: unknown): v is number =>
  num(v) && Number.isSafeInteger(v) && v >= 0;
const pct = (v: unknown): v is number => num(v) && v >= 0 && v <= 100;
function timestamp(v: unknown, now: number) {
  return count(v) && v > 0 && v * 1000 <= now
    ? new Date(v * 1000).toISOString()
    : null;
}
export type EtfReading = {
  score: number | null;
  label: string | null;
  asOf: string | null;
};
export type EtfAggregateEvidence = {
  symbol: string;
  mode: EtfAggregateMode;
  preview: boolean;
  previewReason: string | null;
  asOfDate: string | null;
  computedAt: string;
  coverage: {
    holdingsCount: number;
    holdingsCovered: number;
    weightCovered: number;
    partial: boolean | null;
    totalKnownHoldings: number | null;
  };
  lookbackDays: number | null;
  flow: Record<
    | "netDollars"
    | "buyDollars"
    | "sellDollars"
    | "buyTradeCount"
    | "sellTradeCount"
    | "distinctInsiderCount",
    number | null
  > | null;
  contributors: {
    ticker: string;
    weightPct: number;
    netDollars: number | null;
    weightedNetDollars: number | null;
    tradeCount: number | null;
  }[];
  weighted: EtfReading | null;
  direct: EtfReading | null;
};
export function projectEtfAggregate(
  raw: unknown,
  symbol: string,
  mode: EtfAggregateMode,
  now = Date.now(),
): EtfAggregateEvidence | null {
  const r = obj(raw),
    d = obj(r?.data),
    c = obj(d?.coverage);
  if (
    !etfAggregateRequest(symbol, mode) ||
    !r ||
    typeof r.isPreview !== "boolean" ||
    !d ||
    d.ticker !== symbol ||
    !c
  )
    return null;
  const computedAt = timestamp(d.computedAt, now);
  if (!computedAt) return null;
  let asOfDate: string | null = null;
  if (d.asOfDate != null) {
    if (!text(d.asOfDate) || !/^\d{4}-\d{2}-\d{2}$/.test(d.asOfDate))
      return null;
    const date = Date.parse(d.asOfDate + "T00:00:00Z");
    if (
      !Number.isFinite(date) ||
      date > now ||
      new Date(date).toISOString().slice(0, 10) !== d.asOfDate
    )
      return null;
    asOfDate = d.asOfDate;
  } else if (mode !== "sentiment") return null;
  if (
    !count(c.holdingsCount) ||
    !count(c.holdingsCovered) ||
    c.holdingsCovered > c.holdingsCount ||
    !pct(c.weightCovered) ||
    (c.partial !== null && typeof c.partial !== "boolean") ||
    (c.totalKnownHoldings != null &&
      (!count(c.totalKnownHoldings) || c.totalKnownHoldings < c.holdingsCount))
  )
    return null;
  const base = {
    symbol,
    mode,
    preview: r.isPreview,
    previewReason: text(r.previewReason) ? r.previewReason : null,
    asOfDate,
    computedAt,
    coverage: {
      holdingsCount: c.holdingsCount,
      holdingsCovered: c.holdingsCovered,
      weightCovered: c.weightCovered,
      partial: c.partial as boolean | null,
      totalKnownHoldings: count(c.totalKnownHoldings)
        ? c.totalKnownHoldings
        : null,
    },
  };
  if (mode === "sentiment") {
    const reading = (value: unknown): EtfReading | null => {
      const x = obj(value);
      if (
        !x ||
        (x.sentiSenseScore != null && !num(x.sentiSenseScore)) ||
        (x.scoreLabel != null && !text(x.scoreLabel))
      )
        return null;
      const at =
        x.asOfTimestamp == null ? null : timestamp(x.asOfTimestamp, now);
      if (x.asOfTimestamp != null && !at) return null;
      return {
        score: num(x.sentiSenseScore) ? x.sentiSenseScore : null,
        label: text(x.scoreLabel) ? x.scoreLabel : null,
        asOf: at,
      };
    };
    const weighted = reading(d.constituentsWeighted),
      direct = d.direct == null ? null : reading(d.direct);
    if (!weighted || (d.direct != null && !direct)) return null;
    return {
      ...base,
      lookbackDays: null,
      flow: null,
      contributors: [],
      weighted,
      direct,
    };
  }
  const lookbackDays = mode === "insider30" ? 30 : 90;
  const f = obj(d.weightedNetFlow);
  if (
    d.lookbackDays !== lookbackDays ||
    !f ||
    !Array.isArray(d.topContributors) ||
    d.topContributors.length > 10
  )
    return null;
  const flow = {} as NonNullable<EtfAggregateEvidence["flow"]>;
  for (const key of [
    "netDollars",
    "buyDollars",
    "sellDollars",
    "buyTradeCount",
    "sellTradeCount",
    "distinctInsiderCount",
  ] as const) {
    const value = f[key];
    if (
      value != null &&
      (!num(value) ||
        (key !== "netDollars" && value < 0) ||
        (key.endsWith("Count") && !count(value)))
    )
      return null;
    flow[key] = num(value) ? value : null;
  }
  const contributors: EtfAggregateEvidence["contributors"] = [];
  const seen = new Set<string>();
  for (const item of d.topContributors) {
    const x = obj(item);
    if (
      !x ||
      !text(x.ticker, 40) ||
      seen.has(x.ticker) ||
      !pct(x.weightPct) ||
      (x.netDollars != null && !num(x.netDollars)) ||
      (x.weightedNetDollars != null && !num(x.weightedNetDollars)) ||
      (x.tradeCount != null && !count(x.tradeCount))
    )
      return null;
    seen.add(x.ticker);
    contributors.push({
      ticker: x.ticker,
      weightPct: x.weightPct,
      netDollars: num(x.netDollars) ? x.netDollars : null,
      weightedNetDollars: num(x.weightedNetDollars)
        ? x.weightedNetDollars
        : null,
      tradeCount: count(x.tradeCount) ? x.tradeCount : null,
    });
  }
  return {
    ...base,
    lookbackDays,
    flow,
    contributors,
    weighted: null,
    direct: null,
  };
}
