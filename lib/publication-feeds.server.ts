import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { sentiSenseTicker } from "./sentisense-api";
import {
  publicationSource,
  projectPublications,
  type PublicationSource,
} from "./publication-feeds";
import { readBoundedMarketJson } from "./market-response";
export async function readPublications(
  symbol: string,
  source: PublicationSource,
) {
  if (sentiSenseTicker(symbol) !== symbol || !publicationSource(source))
    throw new HttpError("Unsupported publication request.", 400);
  const key =
    process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN;
  if (!key) throw new HttpError("Publication source is not configured.", 503);
  await limit("sentisense:publication-feeds", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/documents/ticker/${encodeURIComponent(symbol)}?source=${source}&days=30&limit=25`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(12000),
        next: { revalidate: 300 },
      },
      fetch,
    );
  } catch {
    throw new HttpError("Publication source could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 429
        ? "Publication limit reached. Try later."
        : "Publication data is unavailable.",
      [401, 403, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Publication response could not be read safely.", 502);
  }
  const data = projectPublications(raw, symbol, source);
  if (!data)
    throw new HttpError(
      "Publication source or stock identity could not be verified.",
      502,
    );
  return {
    ...data,
    checkedAt: new Date().toISOString(),
    cacheMaxAgeSeconds: 300,
  };
}
