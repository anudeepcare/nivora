import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  activityQuery,
  projectActivity,
  type ActivityQuery,
} from "./politician-activity";
export async function readActivity(
  query: ActivityQuery,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  const q = activityQuery(
    new URLSearchParams({
      days: String(query.days),
      offset: String(query.offset),
    }),
  );
  if (!key)
    throw new HttpError(
      "Congressional activity source is not configured.",
      503,
    );
  await limit("sentisense:politician-activity", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/politicians/activity?lookbackDays=${q.days}&limit=50&offset=${q.offset}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Congressional activity source unavailable.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      "Congressional activity source unavailable.",
      response.status === 429 ? 429 : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Activity response could not be read safely.", 502);
  }
  try {
    return projectActivity(raw, q);
  } catch {
    throw new HttpError(
      "Activity page dates or coverage could not be verified. Return to the first page if access has changed.",
      502,
    );
  }
}
