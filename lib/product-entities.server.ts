import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  productQuery,
  productHandle,
  productMatches,
  productDetail,
} from "./product-entities";
export async function readProductEntity(
  mode: "search" | "detail",
  value: string,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  const valid =
    mode === "search"
      ? productQuery(value)
      : mode === "detail"
        ? productHandle(value)
        : null;
  if (!valid) throw new HttpError("Invalid product lookup.", 400);
  if (!key)
    throw new HttpError("Product lookup source is not configured.", 503);
  await limit("sentisense:product-entities", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/kb/entities/${mode === "search" ? `search?q=${encodeURIComponent(valid)}&type=product&limit=10` : encodeURIComponent(valid)}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Product lookup source could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 404
        ? "This product handle is no longer available. Search its name again."
        : response.status === 429
          ? "Product lookup quota or rate limit reached."
          : "Product lookup is unavailable.",
      [401, 403, 404, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Product response could not be read safely.", 502);
  }
  const data =
    mode === "search" ? productMatches(raw) : productDetail(raw, valid);
  if (!data)
    throw new HttpError(
      "Product identity or supported schema could not be verified.",
      502,
    );
  return { mode, value: valid, data, retrievedAt: new Date().toISOString() };
}
