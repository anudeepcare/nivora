export const indexIds: readonly string[] = [
  "market-mood",
  "fed-sentiment",
  "ai-sentiment",
];
export type IndexScale = "SENTIMENT" | "PERCENT_0_100";
export type IndexCatalogItem = {
  id: string;
  name: string;
  description: string;
  scale: IndexScale;
  tier: "free" | "pro";
};
export type IndexPoint = { date: string; value: number | null };
export type IndexDetail = {
  id: string;
  name: string;
  scale: IndexScale;
  asOf: string | null;
  value: number | null;
  coverage: number | null;
  basketSize: number | null;
  totalMentions: number | null;
  methodology: string;
  constituents:
    | null
    | {
        name: string;
        role: string;
        weight: number;
        value: number | null;
        mentions: number | null;
        state: string;
      }[];
};
export type IndexHistory = {
  id: string;
  name: string;
  scale: IndexScale;
  days: 180;
  points: IndexPoint[];
};
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const text = (x: unknown, max = 300): x is string =>
  typeof x === "string" && x.length > 0 && x.length <= max;
const scale = (x: unknown): x is IndexScale =>
  x === "SENTIMENT" || x === "PERCENT_0_100";
const count = (x: unknown) =>
  x === null || (typeof x === "number" && Number.isSafeInteger(x) && x >= 0);
const reading = (x: unknown, s: IndexScale) =>
  x === null ||
  (typeof x === "number" &&
    Number.isFinite(x) &&
    (s === "SENTIMENT" ? x >= -1 && x <= 1 : x >= 0 && x <= 100));
function date(x: unknown, now: number): x is string {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const n = Date.parse(x);
  return (
    Number.isFinite(n) &&
    new Date(n).toISOString().slice(0, 10) === x &&
    x <= new Date(now).toISOString().slice(0, 10)
  );
}
export function indexCatalog(raw: unknown): IndexCatalogItem[] | null {
  if (!object(raw) || !Array.isArray(raw.indexes) || raw.indexes.length > 100)
    return null;
  const rows: IndexCatalogItem[] = [];
  for (const x of raw.indexes) {
    if (!object(x) || !text(x.indexId, 80)) return null;
    if (!indexIds.includes(x.indexId)) continue;
    if (
      rows.some((r) => r.id === x.indexId) ||
      !text(x.displayName) ||
      !text(x.description, 2000) ||
      !scale(x.scale) ||
      !["free", "pro"].includes(String(x.accessTier))
    )
      return null;
    rows.push({
      id: x.indexId,
      name: x.displayName,
      description: x.description,
      scale: x.scale,
      tier: x.accessTier as "free" | "pro",
    });
  }
  return rows;
}
export function indexDetail(
  raw: unknown,
  id: string,
  now = Date.now(),
): IndexDetail | null {
  if (
    !Number.isFinite(now) ||
    !indexIds.includes(id) ||
    !object(raw) ||
    raw.indexId !== id ||
    raw.isPreview === true ||
    !text(raw.displayName) ||
    !scale(raw.scale) ||
    !reading(raw.value, raw.scale) ||
    !(raw.asOf === null || date(raw.asOf, now)) ||
    !text(raw.methodologyNote, 10000) ||
    ![raw.coverage, raw.basketSize, raw.totalMentions].every(count)
  )
    return null;
  let constituents: IndexDetail["constituents"] = null;
  if (raw.constituents === null) {
    if (
      raw.coverage !== null ||
      raw.basketSize !== null ||
      raw.totalMentions !== null
    )
      return null;
  } else {
    if (
      !Array.isArray(raw.constituents) ||
      raw.constituents.length > 500 ||
      typeof raw.coverage !== "number" ||
      typeof raw.basketSize !== "number" ||
      raw.coverage > raw.basketSize
    )
      return null;
    constituents = [];
    for (const c of raw.constituents) {
      if (
        !object(c) ||
        !text(c.displayName) ||
        !text(c.role) ||
        typeof c.weight !== "number" ||
        !Number.isFinite(c.weight) ||
        c.weight < 0 ||
        !reading(c.value, raw.scale) ||
        !count(c.mentionsCount) ||
        !["FRESH", "CARRIED_FORWARD", "EXCLUDED", "OUT_OF_SEGMENT"].includes(
          String(c.staleness),
        )
      )
        return null;
      constituents.push({
        name: c.displayName,
        role: c.role,
        weight: c.weight,
        value: c.value as number | null,
        mentions: c.mentionsCount as number | null,
        state: c.staleness as string,
      });
    }
  }
  return {
    id,
    name: raw.displayName,
    scale: raw.scale,
    asOf: raw.asOf as string | null,
    value: raw.value as number | null,
    coverage: raw.coverage as number | null,
    basketSize: raw.basketSize as number | null,
    totalMentions: raw.totalMentions as number | null,
    methodology: raw.methodologyNote,
    constituents,
  };
}
export function indexHistory(
  raw: unknown,
  id: string,
  now = Date.now(),
): IndexHistory | null {
  if (
    !Number.isFinite(now) ||
    !indexIds.includes(id) ||
    !object(raw) ||
    raw.indexId !== id ||
    raw.isPreview === true ||
    !text(raw.displayName) ||
    !scale(raw.scale) ||
    raw.days !== 180 ||
    !Array.isArray(raw.history) ||
    raw.history.length > 181
  )
    return null;
  const points: IndexPoint[] = [];
  for (const p of raw.history) {
    if (
      !object(p) ||
      !date(p.date, now) ||
      !reading(p.value, raw.scale) ||
      (points.length && p.date <= points.at(-1)!.date)
    )
      return null;
    points.push({ date: p.date, value: p.value as number | null });
  }
  return { id, name: raw.displayName, scale: raw.scale, days: 180, points };
}
