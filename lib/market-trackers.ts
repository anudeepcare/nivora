/** Documented tracker IDs only; discovery cannot introduce new executable paths. */
export const trackerGroups = {
  Market: ["market-session", "market-heatmap"],
  "Sentiment & attention": [
    "sentiment-movers",
    "sentiment-leaderboard",
    "media-darlings",
    "reddit-picks",
    "trending-products",
  ],
  Institutions: [
    "institution-concentration",
    "institution-aum",
    "hedge-fund-reported-returns",
  ],
  "Industry developments": ["data-center-moratoriums"],
} as const;
export const trackerIds: readonly string[] =
  Object.values(trackerGroups).flat();
export type TrackerCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: "free" | "pro";
  view: "table" | "heatmap";
};
export type TrackerMetric = {
  label: string;
  value: string | number | null;
  unit: string | null;
  asOf: string | null;
  note: string | null;
  period: string | null;
  flags: string[];
  sourceUrl: string | null;
};
export type TrackerSnapshot = {
  id: string;
  name: string;
  description: string;
  asOf: string | null;
  preview: boolean;
  totalCount: number | null;
  withheld: string[];
  headline: TrackerMetric[];
  rows: {
    id: string;
    researchSymbol?: string;
    name: string;
    category: string | null;
    metrics: TrackerMetric[];
  }[];
  limited: boolean;
};
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 300): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const optional = (v: unknown, max = 300) => (text(v, max) ? v : null);
function safeUrl(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 2000) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
function metric(v: unknown): TrackerMetric | null {
  if (
    !obj(v) ||
    !text(v.label, 120) ||
    !(
      v.value === null ||
      (typeof v.value === "number" && Number.isFinite(v.value)) ||
      text(v.value, 500)
    )
  )
    return null;
  return {
    label: v.label,
    value: v.value as string | number | null,
    unit: optional(v.unit, 50),
    asOf: optional(v.asOf, 100),
    note: optional(v.methodologyNote, 1000),
    period: optional(v.periodLabel, 100),
    flags: Array.isArray(v.flags)
      ? v.flags.filter((x): x is string => text(x, 60)).slice(0, 20)
      : [],
    sourceUrl: safeUrl(v.sourceUrl),
  };
}
export function trackerCatalog(raw: unknown): TrackerCatalogItem[] | null {
  if (!obj(raw) || !Array.isArray(raw.trackers) || raw.trackers.length > 100)
    return null;
  const result: TrackerCatalogItem[] = [];
  for (const x of raw.trackers) {
    if (!obj(x) || !text(x.trackerId, 80)) return null;
    if (!trackerIds.includes(x.trackerId)) continue;
    if (
      result.some((r) => r.id === x.trackerId) ||
      !text(x.displayName) ||
      !text(x.description, 1500) ||
      !["free", "pro"].includes(String(x.accessTier)) ||
      !["table", "heatmap"].includes(String(x.viewType))
    )
      return null;
    result.push({
      id: x.trackerId,
      name: x.displayName,
      description: x.description,
      category: optional(x.category) ?? "Other",
      tier: x.accessTier as "free" | "pro",
      view: x.viewType as "table" | "heatmap",
    });
  }
  return result;
}
export function trackerSnapshot(
  raw: unknown,
  id: string,
  onInvalid?: (reason: string) => void,
): TrackerSnapshot | null {
  const reject = (reason: string) => {
    onInvalid?.(reason);
    return null;
  };
  if (
    !trackerIds.includes(id) ||
    !obj(raw) ||
    typeof raw.isPreview !== "boolean" ||
    !obj(raw.data)
  )
    return reject("envelope");
  const d = raw.data;
  if (
    d.trackerId !== id ||
    (d.schemaVersion !== undefined && d.schemaVersion !== "1.0") ||
    !["table", "heatmap"].includes(String(d.viewType)) ||
    !text(d.displayName) ||
    !Array.isArray(d.rows) ||
    d.rows.length > 2000 ||
    (d.headline !== undefined &&
      (!Array.isArray(d.headline) || d.headline.length > 30))
  )
    return reject("snapshot metadata or rows");
  if (
    raw.totalCount !== undefined &&
    raw.totalCount !== null &&
    (!Number.isInteger(raw.totalCount) ||
      Number(raw.totalCount) < d.rows.length)
  )
    return reject("row count");
  const headline = (Array.isArray(d.headline) ? d.headline : []).map(metric);
  if (headline.some((m) => !m)) return reject("headline metrics");
  const meta = obj(d.meta) ? d.meta : {};
  if (
    meta.previewWithheld !== undefined &&
    (!Array.isArray(meta.previewWithheld) ||
      meta.previewWithheld.length > 30 ||
      !meta.previewWithheld.every((x) => text(x, 100)))
  )
    return reject("preview metadata");
  const rows: TrackerSnapshot["rows"] = [];
  for (const [index, x] of d.rows.entries()) {
    if (
      !obj(x) ||
      !text(x.name, 500) ||
      (x.metrics !== undefined && !Array.isArray(x.metrics))
    )
      return reject("row identity or metrics");
    let metrics: TrackerMetric[] = [];
    if (Array.isArray(x.metrics)) {
      if (x.metrics.length > 40) return reject("row metric count");
      const parsed = x.metrics.map(metric);
      if (parsed.some((m) => !m)) return reject("row metrics");
      metrics = parsed as TrackerMetric[];
    }
    if (id === "market-heatmap") {
      metrics = [];
      for (const [key, label, unit] of [
        ["price", "Delayed price", "usd"],
        ["changePercent", "Price change", "percent"],
        ["marketCap", "Market cap", "usd"],
      ] as const) {
        const v = x[key];
        if (
          v !== undefined &&
          v !== null &&
          (typeof v !== "number" || !Number.isFinite(v))
        )
          return reject("heatmap numeric fields");
        metrics.push({
          label,
          value: typeof v === "number" ? v : null,
          unit,
          asOf: optional(x.priceAsOf, 100),
          note: null,
          period: null,
          flags: [],
          sourceUrl: null,
        });
      }
    }
    const rowId = optional(x.rowId, 200) ?? `row-${index + 1}`;
    if (rows.some((r) => r.id === rowId))
      return reject("duplicate row identity");
    rows.push({
      id: rowId,
      // Only these documented boards use a ticker as their public row handle.
      // Never infer from company names, generic row fallbacks, CIKs or product slugs.
      ...([
        "reddit-picks",
        "media-darlings",
        "sentiment-leaderboard",
        "sentiment-movers",
        "market-heatmap",
        "market-session",
      ].includes(id) &&
      typeof x.rowId === "string" &&
      /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,4})?$/.test(x.rowId)
        ? { researchSymbol: x.rowId }
        : {}),
      name: x.name,
      category: optional(x.category),
      metrics,
    });
  }
  return {
    id,
    name: d.displayName,
    description: optional(d.description, 1500) ?? "",
    asOf: optional(d.asOf, 100),
    preview: raw.isPreview,
    totalCount: typeof raw.totalCount === "number" ? raw.totalCount : null,
    withheld: (meta.previewWithheld as string[] | undefined) ?? [],
    headline: headline as TrackerMetric[],
    rows,
    limited: false,
  };
}
