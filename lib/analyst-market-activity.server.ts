import "server-only";
import { sentisenseFetch } from "./sentisense-provider.server";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  analystActivityQuery,
  projectAnalystActivity,
  type AnalystActivityQuery,
} from "./analyst-market-activity";
export async function readAnalystActivity(
  query: AnalystActivityQuery,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  const q = analystActivityQuery(
    new URLSearchParams({
      days: String(query.days),
      offset: String(query.offset),
      mode: query.mode,
    }),
  );
  if (!key)
    throw new HttpError("Analyst activity source is not configured.", 503);
  await limit("sentisense:analyst-market-activity", 20);
  const p = new URLSearchParams({
    lookbackDays: String(q.days),
    limit: "50",
    offset: String(q.offset),
  });
  if (q.mode === "changes") p.set("actionTypes", "UPGRADE,DOWNGRADE,INITIATE");
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/analyst/activity?${p}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 429)
      throw new HttpError(
        "Analyst activity limit reached. Please wait before retrying.",
        429,
      );
    throw new HttpError("Analyst activity source unavailable.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      "Analyst activity source unavailable.",
      response.status === 429 ? 429 : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Analyst response could not be read safely.", 502);
  }
  try {
    return projectAnalystActivity(raw, q);
  } catch {
    throw new HttpError(
      "Analyst page cannot be verified or access is limited to the first page.",
      502,
    );
  }
}
