import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  projectEarningsAnalysis,
  earningsAnalysisQuery,
} from "./earnings-analysis";
export async function readEarningsAnalysis(
  query: ReturnType<typeof earningsAnalysisQuery>,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  query = earningsAnalysisQuery(new URLSearchParams({ view: query.view }));
  if (!key) throw new HttpError("Earnings source is not configured.", 503);
  await limit("sentisense:earnings-analysis", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/${query.path}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Earnings source could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      "Earnings evidence unavailable. Retry later.",
      [401, 403, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Earnings response could not be read safely.", 502);
  }
  try {
    return projectEarningsAnalysis(raw, query, Date.now());
  } catch {
    throw new HttpError(
      "Earnings dates, counts or response shape could not be verified.",
      502,
    );
  }
}
