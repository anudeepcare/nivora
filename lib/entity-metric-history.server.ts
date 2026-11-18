import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { createHash } from "node:crypto";
import { HttpError, limit } from "./server";
import { sentiSenseTicker } from "./sentisense-api";
import { readBoundedMarketJson } from "./market-response";
import {
  metricHistory,
  entityMetric,
  type EntityMetric,
} from "./entity-metric-history";
const cache = new Map<
  string,
  {
    at: number;
    promise: Promise<
      NonNullable<ReturnType<typeof metricHistory>> & { receivedAt: string }
    >;
  }
>();
let cooldown = 0;
export async function readMetricHistory(
  symbol: string,
  metric: EntityMetric,
  days: number,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (
    sentiSenseTicker(symbol) !== symbol ||
    !entityMetric(metric) ||
    ![30, 90].includes(days)
  )
    throw new HttpError("Unsupported stock symbol.", 400);
  if (!key)
    throw new HttpError("Metric history source is not configured.", 503);
  const end = Math.floor(Date.now() / 300000) * 300000;
  const start = end - days * 86400000;
  const id =
    createHash("sha256").update(key).digest("hex") +
    ":" +
    symbol +
    ":" +
    metric +
    ":" +
    days +
    ":" +
    end;
  const existing = cache.get(id);
  if (existing && Date.now() - existing.at < 300000) return existing.promise;
  if (cooldown > Date.now())
    throw new HttpError(
      "Metric history source is cooling down. Try later.",
      429,
    );
  const promise = (async () => {
    await limit("sentisense:entity-metric-history", 20);
    let response: Response;
    try {
      response = await sentisenseFetch(
        `https://app.sentisense.ai/api/v2/metrics/entity/${encodeURIComponent(symbol)}/metric/${metric}?startTime=${start}&endTime=${end}&maxDataPoints=90`,
        {
          headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        },
        fetcher,
      );
    } catch {
      throw new HttpError("Metric history source could not be reached.", 503);
    }
    if (response.status === 429) {
      const wait = Number(response.headers.get("Retry-After"));
      cooldown =
        Date.now() +
        Math.min(3600, Math.max(60, Number.isFinite(wait) ? wait : 60)) * 1000;
      throw new HttpError(
        "Metric history source limit reached. Try later.",
        429,
      );
    }
    if (!response.ok)
      throw new HttpError(
        response.status === 404
          ? "No metric history is available for this stock."
          : "Metric history source is unavailable.",
        [401, 403, 404].includes(response.status) ? response.status : 503,
      );
    let raw: unknown;
    try {
      raw = await readBoundedMarketJson(response, 2000000);
    } catch {
      throw new HttpError(
        "Metric history response could not be read safely.",
        502,
      );
    }
    const result = metricHistory(raw, symbol, metric, days, start, end);
    if (!result)
      throw new HttpError(
        "Metric history identity or evidence date could not be verified.",
        502,
      );
    return { ...result, receivedAt: new Date().toISOString() };
  })();
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(id, { at: Date.now(), promise });
  try {
    return await promise;
  } catch (e) {
    if (cache.get(id)?.promise === promise) cache.delete(id);
    throw e;
  }
}
