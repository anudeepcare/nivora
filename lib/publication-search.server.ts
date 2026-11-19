import "server-only";
import { sentisenseFetch } from "./sentisense-provider.server";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  searchRequest,
  projectSearch,
  type SearchRequest,
} from "./publication-search";
export async function readPublicationSearch(
  input: SearchRequest,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
    signal,
  }: { key?: string; fetcher?: typeof fetch; signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const q = searchRequest(input);
  if (!q) throw new HttpError("Unsupported publication search.", 400);
  if (!key) throw new HttpError("Publication search is not configured.", 503);
  await limit("sentisense:publication-search", 20);
  signal?.throwIfAborted();
  const params = new URLSearchParams({
    query: q.query,
    days: String(q.days),
    limit: "20",
  });
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/documents/${q.kind === "stories" ? "stories/search" : "search"}?${params}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.any([
          AbortSignal.timeout(12000),
          ...(signal ? [signal] : []),
        ]),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Publication search could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 429
        ? "Search allowance reached. Try later."
        : "Publication search is unavailable.",
      [401, 403, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Search response could not be read safely.", 502);
  }
  const result = projectSearch(raw, q);
  if (!result)
    throw new HttpError("Search response could not be verified.", 502);
  return result;
}
