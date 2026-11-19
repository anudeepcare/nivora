import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { createHash } from "node:crypto";
import { HttpError, limit } from "./server";
import { sentiSenseTicker } from "./sentisense-api";
import { readBoundedMarketJson } from "./market-response";
import { stockSentiment } from "./stock-sentiment";
const cache = new Map<
  string,
  {
    at: number;
    promise: Promise<
      NonNullable<ReturnType<typeof stockSentiment>> & { receivedAt: string }
    >;
  }
>();
let cooldown = 0;
export async function readStockSentiment(
  symbol: string,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (sentiSenseTicker(symbol) !== symbol)
    throw new HttpError("Unsupported stock symbol.", 400);
  if (!key) throw new HttpError("Sentiment source is not configured.", 503);
  const id = createHash("sha256").update(key).digest("hex") + ":" + symbol;
  const existing = cache.get(id);
  if (existing && Date.now() - existing.at < 300000) return existing.promise;
  if (cooldown > Date.now())
    throw new HttpError("Sentiment source is cooling down. Try later.", 429);
  const promise = (async () => {
    await limit("sentisense:stock-sentiment", 20);
    let response: Response;
    try {
      response = await sentisenseFetch(
        `https://app.sentisense.ai/api/v1/stocks/${encodeURIComponent(symbol)}/sentiment`,
        {
          headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        },
        fetcher,
      );
    } catch {
      throw new HttpError("Sentiment source could not be reached.", 503);
    }
    if (response.status === 429) {
      const wait = Number(response.headers.get("Retry-After"));
      cooldown =
        Date.now() +
        Math.min(3600, Math.max(60, Number.isFinite(wait) ? wait : 60)) * 1000;
      throw new HttpError("Sentiment source limit reached. Try later.", 429);
    }
    if (!response.ok)
      throw new HttpError(
        response.status === 404
          ? "No sentiment coverage is available for this stock."
          : "Sentiment source is unavailable.",
        [401, 403, 404].includes(response.status) ? response.status : 503,
      );
    let raw: unknown;
    try {
      raw = await readBoundedMarketJson(response, 2000000);
    } catch {
      throw new HttpError("Sentiment response could not be read safely.", 502);
    }
    const result = stockSentiment(raw, symbol);
    if (!result)
      throw new HttpError(
        "Sentiment identity or evidence date could not be verified.",
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
