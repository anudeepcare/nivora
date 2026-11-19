import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import {
  politicianQuery,
  projectDirectory,
  projectMember,
  type PoliticianQuery,
} from "./politician-members";
export async function readPoliticians(
  query: PoliticianQuery,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  const q = politicianQuery(
    new URLSearchParams({
      q: query.q,
      slug: query.slug,
      bioguideId: query.bioguideId,
      offset: String(query.offset),
    }),
  );
  if (!key) throw new HttpError("Member source is not configured.", 503);
  const request = async (path: string) => {
    await limit("sentisense:politician-members", 20);
    let response: Response;
    try {
      response = await sentisenseFetch(
        `https://app.sentisense.ai/api/v1/politicians/${path}`,
        {
          headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(12000),
        },
        fetcher,
      );
    } catch {
      throw new HttpError("Member source unavailable.", 503);
    }
    if (!response.ok)
      throw new HttpError(
        "Member source unavailable.",
        response.status === 429 ? 429 : 503,
      );
    try {
      return await readBoundedMarketJson(response, 2000000);
    } catch {
      throw new HttpError("Member response could not be read safely.", 502);
    }
  };
  const directoryQuery = {
    ...q,
    slug: "",
    bioguideId: "",
    q: q.slug || q.q,
    offset: q.slug ? 0 : q.offset,
  };
  const p = new URLSearchParams({
    limit: "50",
    offset: String(directoryQuery.offset),
  });
  if (directoryQuery.q) p.set("q", directoryQuery.q);
  const rawDirectory = await request(`directory?${p}`);
  let directory;
  try {
    directory = projectDirectory(rawDirectory, directoryQuery);
  } catch {
    throw new HttpError(
      "Member directory identity could not be verified.",
      502,
    );
  }
  if (!q.slug) return directory;
  const verified = directory.members.find(
    (m) =>
      m.urlSlug.toLowerCase() === q.slug.toLowerCase() &&
      m.bioguideId === q.bioguideId,
  );
  if (!verified)
    throw new HttpError("Selected member identity could not be verified.", 502);
  const raw = await request(
    `member/${encodeURIComponent(verified.urlSlug)}?limit=50&offset=${q.offset}`,
  );
  try {
    return projectMember(raw, q, verified);
  } catch {
    throw new HttpError(
      "Member history identity, dates or ranges could not be verified.",
      502,
    );
  }
}
