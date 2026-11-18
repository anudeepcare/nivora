import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import { ratingSymbol, projectRating } from "./provider-rating";
export async function readProviderRating(
  symbol: string,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
    now = Date.now(),
  }: { key?: string; fetcher?: typeof fetch; now?: number } = {},
) {
  if (!ratingSymbol(symbol)) throw new HttpError("Invalid Rating stock.", 400);
  if (!key) throw new HttpError("Rating source is not configured.", 503);
  await limit("sentisense:provider-rating", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/rating/${symbol}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Rating source could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 404
        ? "This stock is not covered by the Rating source."
        : response.status === 429
          ? "Rating quota or rate limit reached. Try later."
          : "Rating source is unavailable.",
      [401, 403, 404, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Rating response could not be read safely.", 502);
  }
  const data = projectRating(raw, symbol, now);
  if (!data)
    throw new HttpError(
      "Rating schema or exact stock identity could not be verified. Canonical or alternate share-class ratings are not substituted.",
      502,
    );
  return { ...data, retrievedAt: new Date().toISOString() };
}
