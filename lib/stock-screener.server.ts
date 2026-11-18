import "server-only";
import { screenInput, screenRows } from "./stock-screener";
import { HttpError, limit } from "./server";
/** Fixed destination and one bounded request. No credentials reach the browser. */
export async function runStockScreen(
  input: unknown,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  const request = screenInput(input);
  if (!request)
    throw new HttpError(
      "Choose a valid screener field, comparison and value.",
      400,
    );
  if (!key)
    throw new HttpError("Stock screener provider is not configured.", 503);
  // Distributed in production; a conservative screener-only ceiling, not a claim
  // that other SentiSense clients share this budget. Provider 429 always wins.
  await limit("sentisense:stock-screener", 20);
  let response: Response;
  try {
    response = await fetcher(
      "https://app.sentisense.ai/api/v1/screener/execute",
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
            filters: [
              {
                fieldName: request.field,
                op: request.op,
                value: request.value,
              },
            ],
            sort: {
              fieldName: request.field,
              dir: request.op === "GTE" ? "DESC" : "ASC",
            },
          },
          limit: 100,
        }),
      },
    );
  } catch {
    throw new HttpError("Stock screener could not reach the provider.", 503);
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
    throw new HttpError("Stock screener is temporarily unavailable.", 503);
  let parsed: unknown;
  try {
    const body = await response.text();
    if (body.length > 2_000_000) throw Error();
    parsed = JSON.parse(body);
  } catch {
    throw new HttpError("Provider returned an unreadable screen.", 502);
  }
  const data = screenRows(parsed);
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
