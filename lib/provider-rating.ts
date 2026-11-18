const dimensionKeys = [
  "crowd",
  "smart_money",
  "options",
  "analysts",
  "fundamentals",
  "earnings",
  "technicals",
];
const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const text = (v: unknown, max = 400): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const number = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const pct = (v: unknown): v is number => number(v) && v >= 0 && v <= 100;
const band = (v: number) =>
  v >= 90 ? "A" : v >= 70 ? "B" : v >= 30 ? "C" : v >= 10 ? "D" : "F";
export function ratingSymbol(v: unknown) {
  return typeof v === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(v) ? v : null;
}
export type RatingDimension = {
  key: string;
  label: string;
  present: boolean;
  percentile: number | null;
  raw: number | null;
  rawLabel: string | null;
  unavailableReason: string | null;
  subLegs: { key: string; label: string; raw: number | null; unit: string }[];
};
export type ProviderRatingData = {
  symbol: string;
  asOf: string;
  rated: boolean;
  reason: string | null;
  presentCount: number;
  score: number | null;
  letter: string | null;
  percentile: number | null;
  penaltyPoints: number | null;
  methodologyVersion: string | null;
  ratedCount: number | null;
  adjustments: { condition: string; points: number }[];
  dimensions: RatingDimension[];
  flags: { key: string; label: string; active: boolean }[];
  disclaimer: string;
  betaNotice: string | null;
};
export function projectRating(
  raw: unknown,
  symbol: string,
  now = Date.now(),
): ProviderRatingData | null {
  const r = obj(raw);
  if (
    !r ||
    !ratingSymbol(symbol) ||
    r.ticker !== symbol ||
    typeof r.rated !== "boolean" ||
    r.isPreview === true ||
    !text(r.asOf) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(r.asOf)
  )
    return null;
  const date = Date.parse(r.asOf + "T00:00:00Z");
  if (
    !Number.isFinite(date) ||
    new Date(date).toISOString().slice(0, 10) !== r.asOf ||
    date > now ||
    !text(r.disclaimer, 5000)
  )
    return null;
  if (
    !Array.isArray(r.dimensions) ||
    r.dimensions.length !== 7 ||
    !Array.isArray(r.flags) ||
    r.flags.length > 20
  )
    return null;
  const dimensions: RatingDimension[] = [];
  const seen = new Set<string>();
  for (const value of r.dimensions) {
    const d = obj(value);
    if (
      !d ||
      !text(d.key) ||
      !dimensionKeys.includes(d.key) ||
      seen.has(d.key) ||
      !text(d.label) ||
      typeof d.present !== "boolean" ||
      (d.present ? !pct(d.percentile) : d.percentile !== null) ||
      !(d.raw === null || number(d.raw)) ||
      (!d.present && d.raw !== null) ||
      (d.rawLabel != null && !text(d.rawLabel))
    )
      return null;
    seen.add(d.key);
    const subLegs: RatingDimension["subLegs"] = [];
    if (d.subLegs != null) {
      if (!Array.isArray(d.subLegs) || d.subLegs.length > 10) return null;
      const legs = new Set<string>();
      for (const value of d.subLegs) {
        const l = obj(value);
        if (
          !l ||
          !text(l.key) ||
          legs.has(l.key) ||
          !text(l.label) ||
          !text(l.unit) ||
          !(l.raw === null || number(l.raw))
        )
          return null;
        legs.add(l.key);
        subLegs.push({
          key: l.key,
          label: l.label,
          raw: l.raw as number | null,
          unit: l.unit,
        });
      }
    }
    dimensions.push({
      key: d.key,
      label: d.label,
      present: d.present,
      percentile: d.percentile as number | null,
      raw: d.raw as number | null,
      rawLabel: text(d.rawLabel) ? d.rawLabel : null,
      unavailableReason: text(d.unavailableReason) ? d.unavailableReason : null,
      subLegs,
    });
  }
  const flags: ProviderRatingData["flags"] = [];
  const flagKeys = new Set<string>();
  for (const value of r.flags) {
    const f = obj(value);
    if (
      !f ||
      !text(f.key) ||
      flagKeys.has(f.key) ||
      !text(f.label) ||
      typeof f.active !== "boolean"
    )
      return null;
    flagKeys.add(f.key);
    flags.push({ key: f.key, label: f.label, active: f.active });
  }
  const present = dimensions.filter((d) => d.present).map((d) => d.key);
  const base = {
    symbol,
    asOf: r.asOf,
    rated: r.rated,
    presentCount: present.length,
    dimensions,
    flags,
    disclaimer: r.disclaimer,
    betaNotice: text(r.betaNotice, 5000) ? r.betaNotice : null,
  };
  if (!r.rated) {
    if (
      !text(r.reason) ||
      !Array.isArray(r.presentDimensions) ||
      r.presentDimensions.length !== present.length ||
      new Set(r.presentDimensions).size !== present.length ||
      r.presentDimensions.some((k) => !present.includes(k)) ||
      (r.dimensionsPresent !== undefined &&
        r.dimensionsPresent !== present.length) ||
      flags.length ||
      [
        "score",
        "letter",
        "percentile",
        "penaltyPoints",
        "riskAdjustments",
        "riskConditions",
        "bucketLetter",
        "composite",
        "ratedCount",
        "methodologyVersion",
      ].some((k) => r[k] !== undefined)
    )
      return null;
    return {
      ...base,
      reason: r.reason,
      score: null,
      letter: null,
      percentile: null,
      penaltyPoints: null,
      methodologyVersion: null,
      ratedCount: null,
      adjustments: [],
    };
  }
  if (
    !pct(r.score) ||
    !pct(r.percentile) ||
    r.letter !== band(r.score) ||
    r.bucketLetter !== band(r.percentile) ||
    !number(r.penaltyPoints) ||
    r.penaltyPoints < 0 ||
    !number(r.composite) ||
    !Number.isSafeInteger(r.ratedCount) ||
    (r.ratedCount as number) < 1 ||
    !text(r.methodologyVersion) ||
    !Array.isArray(r.riskAdjustments) ||
    r.riskAdjustments.length > 30 ||
    !Array.isArray(r.riskConditions) ||
    r.riskConditions.length > 30
  )
    return null;
  // Published eligibility is a response-consistency guard, never a local rating policy.
  const weights: Record<string, number> = {
    crowd: 16,
    smart_money: 16,
    options: 12,
    analysts: 12,
    fundamentals: 20,
    earnings: 8,
    technicals: 16,
  };
  if (
    present.length < 4 ||
    present.reduce((sum, key) => sum + weights[key], 0) < 50
  )
    return null;
  const adjustments: ProviderRatingData["adjustments"] = [];
  const conditions = new Set<string>();
  for (const value of r.riskAdjustments) {
    const a = obj(value);
    if (
      !a ||
      !text(a.condition) ||
      conditions.has(a.condition) ||
      !number(a.points) ||
      a.points < 0 ||
      a.points > 12
    )
      return null;
    conditions.add(a.condition);
    adjustments.push({ condition: a.condition, points: a.points });
  }
  const positive = adjustments
    .filter((a) => a.points > 0)
    .map((a) => a.condition);
  if (
    r.riskConditions.length !== positive.length ||
    new Set(r.riskConditions).size !== positive.length ||
    r.riskConditions.some((c) => !positive.includes(c))
  )
    return null;
  // Verify the published arithmetic, never synthesize a grade or alter source values.
  const total = adjustments.reduce((sum, a) => sum + a.points, 0);
  const expected = Math.max(
    present.length < 6 ? 10 : 0,
    r.percentile - r.penaltyPoints,
  );
  if (
    Math.abs(total - r.penaltyPoints) > 0.11 ||
    Math.abs(expected - r.score) > 0.11
  )
    return null;
  return {
    ...base,
    reason: null,
    score: r.score,
    letter: r.letter as string,
    percentile: r.percentile,
    penaltyPoints: r.penaltyPoints,
    methodologyVersion: r.methodologyVersion,
    ratedCount: r.ratedCount as number,
    adjustments,
  };
}
