import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { readBoundedMarketJson } from "./market-response";
import { etfScreenInput, etfScreenRows } from "./etf-screener";
import { HttpError, limit } from "./server";
/** Fixed destination and one bounded request. No credentials reach the browser. */
export async function runEtfScreen(
  input: unknown,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  const request = etfScreenInput(input);
  if (!request)
    throw new HttpError(
      "Choose a valid screener field, comparison and value.",
      400,
    );
  if (!key)
    throw new HttpError("ETF screener provider is not configured.", 503);
  // Distributed in production; a conservative screener-only ceiling, not a claim
  // that other SentiSense clients share this budget. Provider 429 always wins.
  await limit("sentisense:etf-screener", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      "https://app.sentisense.ai/api/v1/screener/etfs/execute",
      {
        method: "POST",
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
        headers: {
          "X-SentiSense-API-Key": key,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          plan: {
            filters: [request, ...(request.second ? [request.second] : [])].map(
              ({ field, op, value }) => ({ fieldName: field, op, value }),
            ),
            sort: {
              fieldName: request.field,
              dir: request.op === "GTE" ? "DESC" : "ASC",
            },
          },
          limit: 100,
        }),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("ETF screener could not reach the provider.", 503);
  }
  if (response.status === 401 || response.status === 403)
    throw new HttpError(
      "The configured provider key cannot access this screener.",
      403,
    );
  if (response.status === 429)
    throw new HttpError(
      "Provider screener limit reached. Wait before running another screen.",
      429,
    );
  if (!response.ok)
    throw new HttpError("ETF screener is temporarily unavailable.", 503);
  let parsed: unknown;
  try {
    parsed = await readBoundedMarketJson(response, 2 * 1024 * 1024);
  } catch {
    throw new HttpError("Provider returned an unreadable screen.", 502);
  }
  const data = etfScreenRows(parsed);
  if (!data)
    throw new HttpError("Provider returned an unsupported screen format.", 502);
  return {
    ...data,
    limit: 100,
    source: "SentiSense" as const,
    retrievedAt: new Date().toISOString(),
    screen: request,
  };
}
