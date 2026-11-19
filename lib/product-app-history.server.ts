import "server-only";
import { sentisenseFetch } from "./sentisense-provider.server";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import { readProductEntity } from "./product-entities.server";
import { productHandle } from "./product-entities";
import { appMetric, appHistory, type AppMetric } from "./product-app-history";
export async function readAppHistory(
  handle: string,
  metric: AppMetric,
  days: number,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
    now = Date.now(),
  }: { key?: string; fetcher?: typeof fetch; now?: number } = {},
) {
  if (!productHandle(handle) || !appMetric(metric) || ![30, 90].includes(days))
    throw new HttpError("Unsupported product app-history request.", 400);
  if (!key) throw new HttpError("App history source is not configured.", 503);
  await limit("sentisense:product-app-history", 10);
  // Metrics responses have no reliable subject echo: verify PRODUCT at the same public handle first.
  const identity = await readProductEntity("detail", handle, { key, fetcher });
  if (Array.isArray(identity.data) || identity.data.handle !== handle)
    throw new HttpError("Product identity could not be verified.", 502);
  const end = now,
    start = end - days * 86400000;
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v2/metrics/entity/${encodeURIComponent(handle)}/metric/${metric}?startTime=${start}&endTime=${end}&maxDataPoints=100`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError(
      "Product app-history source could not be reached.",
      503,
    );
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 429
        ? "App history quota or rate limit reached. Try later."
        : "Product app history is unavailable.",
      [401, 403, 404, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("App history response could not be read safely.", 502);
  }
  const data = appHistory(raw, handle, metric, days, start, end);
  if (!data)
    throw new HttpError(
      "App history metric, dates or units could not be verified.",
      502,
    );
  return {
    ...data,
    productName: identity.data.name,
    receivedAt: new Date().toISOString(),
  };
}
