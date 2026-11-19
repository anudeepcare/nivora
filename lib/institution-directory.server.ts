import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  projectInstitutionPage,
  type InstitutionQuery,
} from "./institution-directory";
export async function readInstitutionPage(query: InstitutionQuery) {
  const key =
    process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN;
  if (!key) throw new HttpError("Institution data is not configured.", 503);
  await limit("sentisense:institution-directory", 20);
  const p = new URLSearchParams({ limit: "50", offset: String(query.offset) });
  if (!query.cik) {
    p.set("sort", "aumDesc");
    if (query.q) p.set("q", query.q);
    if (query.quarter) p.set("quarter", query.quarter);
  }
  const path = query.cik
    ? `institution/${encodeURIComponent(query.cik)}`
    : "institutions";
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/institutional/${path}?${p}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
        redirect: "error",
        next: { revalidate: 300 },
      },
      fetch,
    );
  } catch {
    throw new HttpError("Institution source could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      "Institution data unavailable. Retry later.",
      response.status === 429 ? 429 : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError("Institution response could not be read safely.", 502);
  }
  try {
    return projectInstitutionPage(raw, query);
  } catch (e) {
    throw new HttpError(
      e instanceof Error ? e.message : "Institution page unavailable.",
      502,
    );
  }
}
