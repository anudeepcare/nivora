import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  insightRequest,
  stockInsights,
  type InsightMode,
} from "./stock-insights";
export async function readStockInsights(
  symbol: string,
  mode: InsightMode,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
    now = Date.now(),
  }: { key?: string; fetcher?: typeof fetch; now?: number } = {},
) {
  const query = insightRequest(symbol, mode, now);
  if (!query) throw new HttpError("Unsupported stock Insights request.", 400);
  if (!key) throw new HttpError("Insights provider is not configured.", 503);
  await limit("sentisense:stock-insights", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/insights${query.path}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Insights provider could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 429
        ? "Insights limit reached. Try later."
        : "Insights data is unavailable for this account or stock.",
      [401, 403, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Insights response could not be read safely.", 502);
  }
  const data = stockInsights(raw, symbol, now);
  if (!data)
    throw new HttpError(
      "Insights schema or stock identity could not be verified.",
      502,
    );
  if (
    mode === "month" &&
    data.rows.some((r) => {
      const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(r.generatedAt));
      return day < query.start! || day > query.end!;
    })
  )
    throw new HttpError(
      "Insights dates do not match the requested window.",
      502,
    );
  return {
    ...data,
    retrievedAt: new Date().toISOString(),
    mode,
    start: query.start,
    end: query.end,
  };
}
