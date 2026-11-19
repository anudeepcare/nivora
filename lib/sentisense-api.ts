import { companyRelationships } from "./company-relationships.ts";
import { researchReport } from "./sentisense-report.ts";
/** Server-only SentiSense adapter. No endpoint, host or credential is caller-controlled.
 * Payloads retain provider units/field names; consumers must validate numeric fields.
 * Memory caching is deduplication, NOT a distributed subscription quota ledger.
 */
export type SentiSenseDataset =
  | "relationships"
  | "aiReport"
  | "institutionProfile"
  | "institutionHistory"
  | "institutionalQuarters"
  | "institutionalActivists"
  | "institutionalFlows"
  | "etfHoldings"
  | "etfAnalyst"
  | "kpiCoverage"
  | "optionsOverview"
  | "tickerStories"
  | "storyDetail"
  | "trackedStockCoverage"
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
  relationships: (t) => `/stocks/${t}/graph?depth=1&cap=30`,
  aiReport: (t) => `/stocks/${t}/ai-summary?depth=deep`,
  institutionProfile: () => "",
  institutionHistory: () => "",
  institutionalQuarters: () => "/institutional/quarters",
  institutionalActivists: () => "", // Quarter is selected from the fixed quarters endpoint.
  institutionalFlows: () => "/institutional/flows?limit=20",
  etfHoldings: (t) => `/etfs/${t}/holdings`,
  etfAnalyst: (t) => `/etfs/${t}/aggregates/analyst`,
  kpiCoverage: () => "/stocks/with-kpis",
  optionsOverview: () => "/options/overview",
  tickerStories: (t) =>
    `/documents/stories?ticker=${t}&filterHours=720&limit=20`,
  storyDetail: () => "", // Only callable through validated readStory.
  trackedStockCoverage: () => "/stocks",
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
  Object.keys(paths).filter(
    (id) =>
      ![
        "storyDetail",
        "trackedStockCoverage",
        "kpiCoverage",
        "optionsOverview",
        "institutionalFlows",
        "institutionProfile",
        "institutionHistory",
        "institutionalQuarters",
        "institutionalActivists",
      ].includes(id),
  ) as SentiSenseDataset[],
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
const universeDatasets = new Set<SentiSenseDataset>([
  "institutionProfile",
  "institutionHistory",
  "trackedStockCoverage",
  "kpiCoverage",
  "optionsOverview",
  "institutionalFlows",
  "institutionalQuarters",
  "institutionalActivists",
]);
const bareDatasets = new Set<SentiSenseDataset>([
  "relationships",
  "aiReport",
  "documents",
  "institutionalQuarters",
  "etfHoldings",
  "kpiCoverage",
  "tickerStories",
  "storyDetail",
  "trackedStockCoverage",
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
  if (dataset === "relationships") return companyRelationships(data) !== null;
  if (dataset === "aiReport") return researchReport(data) !== null;
  if (dataset === "institutionProfile")
    return (
      object(data) &&
      typeof data.filerCik === "string" &&
      dated(data.latestReportDate) &&
      Array.isArray(data.holdings)
    );
  if (dataset === "institutionHistory")
    return (
      object(data) &&
      typeof data.filerCik === "string" &&
      Array.isArray(data.quarters) &&
      data.quarters.every((q) => object(q) && dated(q.reportDate))
    );

  if (dataset === "institutionalQuarters")
    return (
      Array.isArray(data) &&
      data.every(
        (row) =>
          object(row) &&
          dated(row.reportDate) &&
          typeof row.pending === "boolean",
      )
    );
  if (dataset === "institutionalActivists")
    return (
      Array.isArray(data) &&
      data.every(
        (row) =>
          object(row) &&
          typeof row.filerName === "string" &&
          typeof row.ticker === "string" &&
          dated(row.reportDate) &&
          ["NEW", "INCREASED"].includes(String(row.changeType)) &&
          [
            row.shares,
            row.valueUsd,
            row.sharesChange,
            row.sharesChangePct,
          ].every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0),
      )
    );

  if (dataset === "institutionalFlows")
    return (
      object(data) &&
      dated(data.reportDate) &&
      typeof data.isPending === "boolean" &&
      [data.inflows, data.outflows].every(
        (rows) =>
          Array.isArray(rows) &&
          rows.every(
            (row) =>
              object(row) &&
              typeof row.ticker === "string" &&
              typeof row.netSharesChange === "number" &&
              Number.isFinite(row.netSharesChange),
          ),
      )
    );

  if (dataset === "etfHoldings")
    return (
      object(data) &&
      typeof data.ticker === "string" &&
      dated(data.asOfDate) &&
      Number.isInteger(data.totalHoldings) &&
      Number(data.totalHoldings) >= 0 &&
      Array.isArray(data.holdings) &&
      data.holdings.every(
        (row) =>
          object(row) &&
          typeof row.ticker === "string" &&
          typeof row.weightPct === "number" &&
          Number.isFinite(row.weightPct) &&
          row.weightPct >= 0 &&
          row.weightPct <= 100,
      )
    );
  if (dataset === "kpiCoverage")
    return (
      object(data) &&
      Number.isInteger(data.count) &&
      Number(data.count) >= 0 &&
      Array.isArray(data.tickers) &&
      data.tickers.every(
        (row) =>
          object(row) &&
          typeof row.ticker === "string" &&
          sentiSenseTicker(row.ticker) !== null &&
          typeof row.companyName === "string" &&
          dated(row.lastUpdated) &&
          Number.isInteger(row.kpiCount) &&
          Number(row.kpiCount) >= 0,
      )
    );
  if (dataset === "optionsOverview") {
    const validRows = (rows: unknown) =>
      Array.isArray(rows) &&
      rows.every(
        (row) =>
          object(row) &&
          typeof row.ticker === "string" &&
          sentiSenseTicker(row.ticker) !== null &&
          dated(row.asOf),
      );
    return (
      object(data) &&
      dated(data.asOf) &&
      validRows(data.rows) &&
      (!Object.hasOwn(data, "etfRows") || validRows(data.etfRows)) &&
      Number.isInteger(data.coverageCount) &&
      Number(data.coverageCount) >= 0
    );
  }
  if (dataset === "etfAnalyst")
    return (
      object(data) &&
      typeof data.ticker === "string" &&
      dated(data.asOfDate) &&
      object(data.coverage) &&
      object(data.weightedConsensus) &&
      Array.isArray(data.topContributors)
    );

  if (dataset === "trackedStockCoverage")
    return (
      Array.isArray(data) &&
      data.every(
        (t) => typeof t === "string" && /^[A-Z][A-Z0-9.\-]{0,14}$/.test(t),
      )
    );
  if (dataset === "tickerStories")
    return (
      Array.isArray(data) &&
      data.every(
        (row) =>
          object(row) &&
          typeof row.id === "string" &&
          object(row.cluster) &&
          typeof row.cluster.title === "string" &&
          Array.isArray(row.tickers),
      )
    );
  if (dataset === "storyDetail")
    return (
      object(data) &&
      typeof data.id === "string" &&
      typeof data.title === "string" &&
      Array.isArray(data.tickers) &&
      typeof data.narrativeBody === "string" &&
      object(data.citationLinks)
    );
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
  async function readInternal(
    symbol: string,
    dataset: SentiSenseDataset,
    storyId?: string,
  ): Promise<SentiSenseResult> {
    const ticker = universeDatasets.has(dataset)
      ? ""
      : sentiSenseTicker(symbol);
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
    if (
      (!universeDatasets.has(dataset) && !ticker) ||
      !Object.hasOwn(paths, dataset) ||
      (["institutionProfile", "institutionHistory"].includes(dataset) &&
        (!storyId || !/^\d{1,10}$/.test(storyId))) ||
      (dataset === "institutionalActivists" &&
        (!storyId ||
          !/^\d{4}-\d{2}-\d{2}$/.test(storyId) ||
          !dated(storyId))) ||
      (dataset === "storyDetail" &&
        (!storyId || !/^[A-Za-z0-9_-]{1,128}$/.test(storyId)))
    )
      return empty("invalid-request");
    if (!key) return empty("unavailable");
    const cacheKey = `${ticker}:${dataset}:${storyId ?? ""}`,
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
          `https://app.sentisense.ai/api/v1${dataset === "storyDetail" ? `/documents/stories/${encodeURIComponent(storyId!)}` : dataset === "institutionalActivists" ? `/institutional/activist?reportDate=${encodeURIComponent(storyId!)}` : dataset === "institutionProfile" ? `/institutional/institution/${storyId}?limit=50&offset=0` : dataset === "institutionHistory" ? `/institutional/institution/${storyId}/history?quarters=8` : paths[dataset](encodeURIComponent(ticker!))}`,
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
        if (["options", "optionsOverview"].includes(dataset) && data === null)
          return empty("no-coverage");
        if (!validPayload(dataset, data)) return empty("invalid-response");
        if (
          (dataset === "tickerStories" &&
            (data as JsonObject[]).some(
              (row) =>
                !(row.tickers as unknown[]).some(
                  (t) =>
                    typeof t === "string" && sentiSenseTicker(t) === ticker,
                ),
            )) ||
          (dataset === "storyDetail" &&
            (!object(data) ||
              data.id !== storyId ||
              !(data.tickers as unknown[]).some(
                (t) => typeof t === "string" && sentiSenseTicker(t) === ticker,
              )))
        )
          return empty("subject-mismatch");
        if (
          (!universeDatasets.has(dataset) && !matchesSubject(data, ticker!)) ||
          (dataset === "documents" &&
            object(data) &&
            typeof data.searchTicker === "string" &&
            sentiSenseTicker(data.searchTicker) !== ticker) ||
          (typeof body.ticker === "string" &&
            body.ticker.toUpperCase() !== ticker)
        )
          return empty("subject-mismatch");
        if (
          dataset === "institutionalActivists" &&
          Array.isArray(data) &&
          data.some((row) => !object(row) || row.reportDate !== storyId)
        )
          return empty("invalid-response");
        if (
          ["institutionProfile", "institutionHistory"].includes(dataset) &&
          (!object(data) ||
            typeof data.filerCik !== "string" ||
            data.filerCik.padStart(10, "0") !== storyId?.padStart(10, "0"))
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
            dataset === "aiReport" ? researchReport(data)?.updatedAt : null,
            dataset === "institutionalActivists" ? storyId : null,
            object(data) ? data.latestReportDate : null,
            object(data) ? data.asOf : null,
            dataset === "institutionalFlows" && object(data)
              ? data.reportDate
              : null,
            (dataset === "etfAnalyst" || dataset === "etfHoldings") &&
            object(data)
              ? data.asOfDate
              : null,
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
    cache.set(cacheKey, {
      until:
        now() +
        ([
          "trackedStockCoverage",
          "kpiCoverage",
          "institutionalQuarters",
          "institutionalActivists",
        ].includes(dataset)
          ? 86400000
          : ["optionsOverview", "institutionalFlows"].includes(dataset)
            ? 900000
            : ttlMs),
      value,
    });
    if (cache.size > 256) cache.delete(cache.keys().next().value!);
    const result = await value;
    if (!["available", "preview", "no-coverage"].includes(result.status))
      cache.delete(cacheKey);
    return result;
  }
  const read = (symbol: string, dataset: SentiSenseDataset) =>
    readInternal(
      symbol,
      dataset === "storyDetail" || universeDatasets.has(dataset)
        ? ("__invalid" as SentiSenseDataset)
        : dataset,
    );
  return Object.assign(read, {
    readStory: (symbol: string, id: string) =>
      readInternal(symbol, "storyDetail", id),
    institution: (cik: string, history = false) =>
      readInternal(
        "",
        history ? "institutionHistory" : "institutionProfile",
        cik,
      ),
    trackedStocks: () => readInternal("", "trackedStockCoverage"),
    kpiCoverage: () => readInternal("", "kpiCoverage"),
    optionsOverview: () => readInternal("", "optionsOverview"),
    institutionalFlows: () => readInternal("", "institutionalFlows"),
    institutionalActivists: async () => {
      const quarters = await readInternal("", "institutionalQuarters");
      if (quarters.status !== "available" || !Array.isArray(quarters.data))
        return {
          ...quarters,
          dataset: "institutionalActivists" as const,
          data: null,
        };
      const eligible = quarters.data
        .filter(
          (q: unknown) =>
            object(q) &&
            q.pending === false &&
            q.ownershipEligible !== false &&
            typeof q.reportDate === "string" &&
            q.reportDate <= new Date(now()).toISOString().slice(0, 10),
        )
        .sort((a, b) =>
          String(b.reportDate).localeCompare(String(a.reportDate)),
        )[0];
      if (!eligible)
        return {
          ...quarters,
          dataset: "institutionalActivists" as const,
          status: "no-coverage" as const,
          data: null,
        };
      return readInternal("", "institutionalActivists", eligible.reportDate);
    },
  });
}
export const sentisenseEnabled = () =>
  Boolean(process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN);
const guardedSentiSenseFetch: typeof fetch = async (input, init) =>
  (await import("./sentisense-provider.server")).sentisenseFetch(input, init);
let singleton: ReturnType<typeof createSentiSenseClient> | undefined;
export function sentisenseRead(symbol: string, dataset: SentiSenseDataset) {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton(symbol, dataset);
}

export function sentisenseStoryRead(symbol: string, id: string) {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton.readStory(symbol, id);
}
export function sentisenseTrackedStocks() {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton.trackedStocks();
}

export function sentisenseKpiCoverage() {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton.kpiCoverage();
}
export function sentisenseOptionsOverview() {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton.optionsOverview();
}

export function sentisenseInstitutionalFlows() {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton.institutionalFlows();
}

export function sentisenseInstitutionalActivists() {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton.institutionalActivists();
}

export function sentisenseInstitution(cik: string, history = false) {
  singleton ??= createSentiSenseClient({
    fetcher: guardedSentiSenseFetch,
    key: process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
  });
  return singleton.institution(cik, history);
}
