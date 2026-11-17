/** Server-only SentiSense adapter. No endpoint, host or credential is caller-controlled.
 * Payloads retain provider units/field names; consumers must validate numeric fields.
 * Memory caching is deduplication, NOT a distributed subscription quota ledger.
 */
export type SentiSenseDataset =
  | "consensus"
  | "estimates"
  | "earnings"
  | "holders"
  | "insiders"
  | "politicians"
  | "options"
  | "documents"
  | "filingChanges"
  | "consensusHistory"
  | "analystActions"
  | "analystCoverage"
  | "earningsReactions"
  | "ownershipHistory"
  | "optionsHistory"
  | "optionsIntraday"
  | "kpis"
  | "profile"
  | "fundamentalsCurrent"
  | "fundamentalsQuarterly"
  | "fundamentalsAnnual"
  | "shortInterest"
  | "float"
  | "shortVolume"
  | "stockEtfs"
  | "kpiTypes";
export type SentiSenseResult = {
  symbol: string;
  dataset: SentiSenseDataset;
  source: "SentiSense";
  entitlement: "unverified";
  commercialDisplay: "license-review-required";
  totalCount: number | null;
  status:
    | "available"
    | "preview"
    | "unavailable"
    | "restricted"
    | "unauthorized"
    | "rate-limited"
    | "no-coverage"
    | "invalid-request"
    | "invalid-response"
    | "subject-mismatch";
  data: unknown;
  asOf: string | null;
  retrievedAt: string;
  isPreview: boolean;
  sampleCompany: boolean;
  retryAfterSeconds?: number;
};
const paths: Record<SentiSenseDataset, (ticker: string) => string> = {
  profile: (t) => `/stocks/${t}/profile`,
  fundamentalsCurrent: (t) => `/stocks/fundamentals/current?ticker=${t}`,
  fundamentalsQuarterly: (t) =>
    `/stocks/fundamentals/history?ticker=${t}&timeframe=quarterly&limit=40`,
  fundamentalsAnnual: (t) =>
    `/stocks/fundamentals/history?ticker=${t}&timeframe=annual&limit=20`,
  shortInterest: (t) => `/stocks/short-interest?ticker=${t}&limit=24`,
  float: (t) => `/stocks/float?ticker=${t}`,
  shortVolume: (t) => `/stocks/short-volume?ticker=${t}&limit=90`,
  stockEtfs: (t) => `/stocks/${t}/etfs?limit=25`,
  kpiTypes: (t) => `/stocks/${t}/kpis/types`,
  consensusHistory: (t) => `/analyst/${t}/consensus/history?limit=90`,
  analystActions: (t) => `/analyst/${t}/actions?lookbackDays=90`,
  analystCoverage: (t) => `/analyst/${t}/coverage?lookbackDays=180`,
  earningsReactions: (t) => `/stocks/${t}/earnings/reactions`,
  ownershipHistory: (t) => `/institutional/holders/${t}/history?quarters=20`,
  optionsHistory: (t) => `/stocks/${t}/options/history?window=5y`,
  optionsIntraday: (t) => `/stocks/${t}/options/intraday-history`,
  kpis: (t) => `/stocks/${t}/kpis`,
  consensus: (t) => `/analyst/${t}/consensus`,
  estimates: (t) => `/analyst/${t}/estimates`,
  earnings: (t) => `/stocks/${t}/earnings-summaries?limit=4`,
  holders: (t) => `/institutional/holders/${t}?limit=50`,
  insiders: (t) => `/insider/trades/${t}?lookbackDays=90`,
  politicians: (t) => `/politicians/filings/${t}?lookbackDays=90`,
  options: (t) => `/stocks/${t}/options/summary`,
  documents: (t) => `/documents/ticker/${t}?source=NEWS&days=30&limit=25`,
  filingChanges: (t) => `/stocks/${t}/what-changed?limit=4`,
};
export const SENTISENSE_DATASETS = Object.freeze(
  Object.keys(paths) as SentiSenseDataset[],
);

type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject =>
  !!value && typeof value === "object" && !Array.isArray(value);
const arrayRows = (data: unknown) =>
  Array.isArray(data)
    ? data
    : object(data) && Array.isArray(data.results)
      ? data.results
      : null;
const dated = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) &&
  Number.isFinite(Date.parse(value));
/** US common equities only; qualified foreign symbols and crypto must never alias US. */
export function sentiSenseTicker(symbol: string): string | null {
  const raw = String(symbol).trim().toUpperCase();
  const explicit = raw.endsWith(".US");
  const ticker = explicit ? raw.slice(0, -3) : raw;
  if (!/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z])?$/.test(ticker)) return null;
  if (!explicit && /\.(?:L|F|V|T)$/.test(ticker)) return null;
  return ticker.replace(/-([A-Z])$/, ".$1");
}
const bareDatasets = new Set<SentiSenseDataset>([
  "earningsReactions",
  "profile",
  "fundamentalsCurrent",
  "fundamentalsQuarterly",
  "fundamentalsAnnual",
  "shortInterest",
  "float",
  "shortVolume",
  "stockEtfs",
  "kpiTypes",
]);
function validPayload(dataset: SentiSenseDataset, data: unknown): boolean {
  if (dataset === "stockEtfs")
    return (
      Array.isArray(data) &&
      data.every(
        (row) =>
          object(row) &&
          typeof row.etfTicker === "string" &&
          typeof row.weightPct === "number" &&
          Number.isFinite(row.weightPct) &&
          row.weightPct >= 0 &&
          row.weightPct <= 100,
      )
    );
  if (dataset === "kpiTypes")
    return (
      Array.isArray(data) &&
      data.every(
        (row) =>
          object(row) &&
          typeof row.id === "string" &&
          typeof row.name === "string",
      )
    );
  if (
    [
      "earnings",
      "insiders",
      "politicians",
      "filingChanges",
      "analystActions",
    ].includes(dataset)
  )
    return arrayRows(data) !== null;
  if (!object(data)) return false;
  if (dataset === "profile")
    return (
      typeof data.ticker === "string" &&
      ["STOCK", "ETF"].includes(String(data.kind))
    );
  if (dataset === "float")
    return (
      typeof data.ticker === "string" &&
      ["freeFloat", "freeFloatPercent", "effectiveDate"].every((k) =>
        Object.hasOwn(data, k),
      )
    );
  if (dataset === "fundamentalsCurrent")
    return (
      typeof data.ticker === "string" && typeof data.available === "boolean"
    );
  const arrayField = {
    fundamentalsQuarterly: "periods",
    fundamentalsAnnual: "periods",
    shortInterest: "dataPoints",
    shortVolume: "dataPoints",
    consensusHistory: "history",
    analystCoverage: "coverage",
    earningsReactions: "reactions",
    ownershipHistory: "quarters",
    optionsHistory: "series",
    optionsIntraday: "series",
    kpis: "kpis",
  } as Partial<Record<SentiSenseDataset, string>>;
  const field = arrayField[dataset];
  if (field)
    return typeof data.ticker === "string" && Array.isArray(data[field]);
  if (dataset === "estimates")
    return (
      typeof data.ticker === "string" &&
      Array.isArray(data.estimates) &&
      Array.isArray(data.surprises)
    );
  if (dataset === "holders")
    return typeof data.ticker === "string" && Array.isArray(data.holders);
  if (dataset === "documents")
    return Array.isArray(data.documents) && Number.isInteger(data.totalCount);
  if (dataset === "options")
    return (
      dated(data.asOf) &&
      ["latest", "context", "oiWalls", "unusual"].some((key) =>
        Object.hasOwn(data, key),
      )
    );
  return ["targetMean", "consensusLabel", "history", "actions", "firms"].some(
    (key) => Object.hasOwn(data, key),
  );
}
function matchesSubject(data: unknown, ticker: string): boolean {
  const check = (row: unknown) =>
    !object(row) ||
    typeof row.ticker !== "string" ||
    row.ticker.toUpperCase() === ticker;
  if (!check(data)) return false;
  const rows = arrayRows(data);
  return !rows || rows.every(check);
}
export function createSentiSenseClient({
  key,
  fetcher = globalThis.fetch,
  now = Date.now,
  ttlMs = 60_000,
}: {
  key?: string;
  fetcher?: typeof fetch;
  now?: () => number;
  ttlMs?: number;
} = {}) {
  const cache = new Map<
    string,
    { until: number; value: Promise<SentiSenseResult> }
  >();
  let active = 0,
    pausedUntil = 0;
  return async function read(
    symbol: string,
    dataset: SentiSenseDataset,
  ): Promise<SentiSenseResult> {
    const ticker = sentiSenseTicker(symbol);
    const base: SentiSenseResult = {
      symbol: ticker ?? String(symbol),
      dataset,
      source: "SentiSense",
      entitlement: "unverified",
      commercialDisplay: "license-review-required",
      totalCount: null,
      status: "unavailable",
      data: null,
      asOf: null,
      retrievedAt: new Date(now()).toISOString(),
      isPreview: false,
      sampleCompany: false,
    };
    const empty = (
      status: SentiSenseResult["status"],
      extra: Partial<SentiSenseResult> = {},
    ): SentiSenseResult => ({ ...base, status, ...extra });
    if (!ticker || !Object.hasOwn(paths, dataset))
      return empty("invalid-request");
    if (!key) return empty("unavailable");
    const cacheKey = `${ticker}:${dataset}`,
      hit = cache.get(cacheKey);
    if (hit && hit.until > now()) return hit.value;
    if (pausedUntil > now())
      return empty("rate-limited", {
        retryAfterSeconds: Math.ceil((pausedUntil - now()) / 1000),
      });
    if (active >= 4) return empty("rate-limited", { retryAfterSeconds: 1 });
    active++;
    const value = (async (): Promise<SentiSenseResult> => {
      try {
        const response = await fetcher(
          `https://app.sentisense.ai/api/v1${paths[dataset](encodeURIComponent(ticker))}`,
          {
            headers: {
              "X-SentiSense-API-Key": key,
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(12_000),
            cache: "no-store",
          },
        );
        if (response.status === 401) return empty("unauthorized");
        if (response.status === 403) return empty("restricted");
        if (response.status === 404) return empty("no-coverage");
        if (response.status === 429) {
          const raw = response.headers.get("retry-after"),
            seconds =
              raw && /^\d+$/.test(raw)
                ? Number(raw)
                : raw && Number.isFinite(Date.parse(raw))
                  ? Math.ceil((Date.parse(raw) - now()) / 1000)
                  : 60;
          const retryAfterSeconds = Math.max(1, Math.min(3600, seconds));
          pausedUntil = now() + retryAfterSeconds * 1000;
          return empty("rate-limited", { retryAfterSeconds });
        }
        if (!response.ok) return empty("unavailable");
        const rawBody: unknown = await response.json();
        const body = rawBody as JsonObject;
        if (
          (!object(body) &&
            !(bareDatasets.has(dataset) && Array.isArray(body))) ||
          (!Object.hasOwn(body, "data") && !bareDatasets.has(dataset)) ||
          (object(body) && body.success === false) ||
          ["error", "failed", "failure"].includes(
            String(object(body) ? body.status : null).toLowerCase(),
          )
        )
          return empty("invalid-response");
        const data =
          bareDatasets.has(dataset) && !Object.hasOwn(body, "data")
            ? body
            : body.data;
        if (
          dataset === "optionsIntraday" &&
          data === null &&
          body.isPreview === true
        )
          return empty("preview", { isPreview: true });
        if (dataset === "options" && data === null) return empty("no-coverage");
        if (!validPayload(dataset, data)) return empty("invalid-response");
        if (
          !matchesSubject(data, ticker) ||
          (typeof body.ticker === "string" &&
            body.ticker.toUpperCase() !== ticker)
        )
          return empty("subject-mismatch");
        // sampleCompany is a boolean full-access exemption, not another ticker.
        if (
          typeof body.sampleCompany === "string" &&
          body.sampleCompany.toUpperCase() !== ticker
        )
          return empty("subject-mismatch");
        const isPreview = body.isPreview === true;
        const asOf =
          [
            object(data) ? data.asOf : null,
            object(data) ? data.updatedAt : null,
            object(data) ? data.lastUpdated : null,
            body.asOf,
            body.updatedAt,
          ].find(dated) ?? null;
        return {
          ...base,
          status: isPreview ? "preview" : "available",
          data,
          asOf,
          isPreview,
          sampleCompany: body.sampleCompany === true,
          totalCount:
            typeof body.totalCount === "number" &&
            Number.isInteger(body.totalCount) &&
            body.totalCount >= 0
              ? body.totalCount
              : null,
        };
      } catch {
        return empty("unavailable");
      } finally {
        active--;
      }
    })();
    cache.set(cacheKey, { until: now() + ttlMs, value });
    if (cache.size > 256) cache.delete(cache.keys().next().value!);
    const result = await value;
    if (!["available", "preview", "no-coverage"].includes(result.status))
      cache.delete(cacheKey);
    return result;
  };
}
export const sentisenseEnabled = () =>
  Boolean(process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN);
let singleton: ReturnType<typeof createSentiSenseClient> | undefined;
export function sentisenseRead(symbol: string, dataset: SentiSenseDataset) {
  singleton ??= createSentiSenseClient({
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton(symbol, dataset);
}
