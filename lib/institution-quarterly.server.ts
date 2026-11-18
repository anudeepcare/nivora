import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  quarterlyQuery,
  selectQuarter,
  projectQuarterly,
  type QuarterlyQuery,
} from "./institution-quarterly";
export async function readQuarterly(
  query: QuarterlyQuery,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  const q = quarterlyQuery(
    new URLSearchParams({ view: query.view, reportDate: query.reportDate }),
  );
  if (!key)
    throw new HttpError("Quarterly institution source is not configured.", 503);
  const request = async (path: string) => {
    await limit("sentisense:institution-quarterly", 20);
    let response: Response;
    try {
      response = await sentisenseFetch(
        `https://app.sentisense.ai/api/v1/institutional/${path}`,
        {
          headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(12000),
        },
        fetcher,
      );
    } catch {
      throw new HttpError("Quarterly institution source unavailable.", 503);
    }
    if (!response.ok)
      throw new HttpError(
        "Quarterly institution source unavailable.",
        response.status === 429 ? 429 : 503,
      );
    try {
      return await readBoundedMarketJson(response, 2000000);
    } catch {
      throw new HttpError("Quarterly response could not be read safely.", 502);
    }
  };
  const quarters = await request("quarters");
  let reportDate: string;
  try {
    reportDate = selectQuarter(quarters, q.reportDate);
  } catch {
    throw new HttpError(
      "Requested settled reporting quarter is unavailable.",
      502,
    );
  }
  const raw = await request(
    `${q.view}?reportDate=${encodeURIComponent(reportDate)}`,
  );
  try {
    return projectQuarterly(raw, q, reportDate);
  } catch {
    throw new HttpError(
      "Quarterly response identity or shape could not be verified.",
      502,
    );
  }
}
