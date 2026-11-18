import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  etfAggregateRequest,
  projectEtfAggregate,
  type EtfAggregateMode,
} from "./etf-aggregate-evidence";
export async function readEtfAggregate(
  symbol: string,
  mode: EtfAggregateMode,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
    now = Date.now(),
  }: { key?: string; fetcher?: typeof fetch; now?: number } = {},
) {
  const query = etfAggregateRequest(symbol, mode);
  if (!query) throw new HttpError("Unsupported ETF aggregate request.", 400);
  if (!key) throw new HttpError("ETF source is not configured.", 503);
  await limit("sentisense:etf-aggregate-evidence", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/etfs${query.path}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("ETF evidence source could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 404
        ? "ETF aggregate unavailable: fund coverage, activity or underlying data may be insufficient."
        : response.status === 429
          ? "ETF quota or rate limit reached. Try later."
          : "ETF evidence is unavailable.",
      [401, 403, 404, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("ETF response could not be read safely.", 502);
  }
  const data = projectEtfAggregate(raw, symbol, mode, now);
  if (!data)
    throw new HttpError(
      "ETF identity, dates or aggregate schema could not be verified.",
      502,
    );
  return { ...data, retrievedAt: new Date().toISOString() };
}
