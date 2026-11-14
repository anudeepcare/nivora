/** A separate provider observation, never merged with financial evidence. */
export type AnalystTargets = {
  symbol: string;
  currency: "USD";
  source: "SentiSense";
  sourceField: "consensus.targetMean";
  updatedAt: string;
  timestampBasis: "dataset-refresh";
  low: number;
  target: number;
  high: number;
  analysts: number | null;
};
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const unwrap = (value: unknown) => {
  const outer = record(value);
  return outer && "data" in outer ? record(outer.data) : outer;
};
const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
/** Date.parse alone accepts impossible calendar dates such as February 30. */
export function strictUtcTimestamp(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
  )
    return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  const canonical = new Date(parsed).toISOString();
  return canonical.slice(0, 19) === value.slice(0, 19) ? parsed : null;
}
function currentDate(value: unknown, now: number) {
  const at = strictUtcTimestamp(value);
  return (
    Number.isFinite(now) &&
    at !== null &&
    at <= now + 60_000 &&
    now - at <= 7 * 86_400_000
  );
}
function band(low: unknown, target: unknown, high: unknown) {
  return (
    positive(low) &&
    positive(target) &&
    positive(high) &&
    low <= target &&
    target <= high
  );
}
function count(value: unknown): value is number | null | undefined {
  return value == null || (positive(value) && Number.isInteger(value));
}
export function normalizeSentiSenseTargets(
  consensus: unknown,
  profile: unknown,
  symbol: string,
  now: number,
): AnalystTargets | null {
  const c = unwrap(consensus),
    p = unwrap(profile);
  if (
    !c ||
    !p ||
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ||
    c.ticker !== symbol ||
    p.ticker !== symbol ||
    typeof p.currency !== "string" ||
    p.currency.toUpperCase() !== "USD" ||
    (c.currency != null &&
      (typeof c.currency !== "string" || c.currency.toUpperCase() !== "USD")) ||
    !["XNAS", "XNYS", "XASE", "ARCX", "BATS"].includes(
      String(p.primaryExchange),
    ) ||
    !currentDate(c.updatedAt, now) ||
    !band(c.targetLow, c.targetMean, c.targetHigh) ||
    !count(c.numberOfAnalysts)
  )
    return null;
  const at = strictUtcTimestamp(c.updatedAt)!;
  if (
    c.updatedAtEpoch != null &&
    (typeof c.updatedAtEpoch !== "number" ||
      !Number.isInteger(c.updatedAtEpoch) ||
      c.updatedAtEpoch !== Math.floor(at / 1000))
  )
    return null;
  return {
    symbol,
    currency: "USD",
    source: "SentiSense",
    sourceField: "consensus.targetMean",
    updatedAt: c.updatedAt as string,
    timestampBasis: "dataset-refresh",
    low: c.targetLow as number,
    target: c.targetMean as number,
    high: c.targetHigh as number,
    analysts: (c.numberOfAnalysts as number | null | undefined) ?? null,
  };
}
/** Revalidate at consumption: cached evidence must not revive stale targets. */
export function usableAnalystTargets(
  value: AnalystTargets | undefined,
  symbol: string,
  currency: string,
  now: number,
): value is AnalystTargets {
  return (
    !!value &&
    value.symbol === symbol &&
    currency === "USD" &&
    value.currency === currency &&
    value.source === "SentiSense" &&
    value.sourceField === "consensus.targetMean" &&
    value.timestampBasis === "dataset-refresh" &&
    currentDate(value.updatedAt, now) &&
    band(value.low, value.target, value.high) &&
    count(value.analysts)
  );
}
