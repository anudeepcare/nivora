import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { analystSlug, personProfile, personCalls } from "./analyst-person";
export async function readAnalystPerson(
  slug: string,
  mode: "profile" | "calls" = "profile",
  offset = 0,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (
    !analystSlug(slug) ||
    !["profile", "calls"].includes(mode) ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 10000 ||
    offset % 25 !== 0 ||
    (mode === "profile" && offset !== 0)
  )
    throw new HttpError("Invalid analyst request.", 400);
  if (!key) throw new HttpError("Analyst provider is not configured.", 503);
  await limit("sentisense:analyst-people", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/analyst/people/${slug}${mode === "calls" ? `/calls?limit=25&offset=${offset}` : ""}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Analyst provider could not be reached.", 503);
  }
  if ([401, 403].includes(response.status))
    throw new HttpError(
      "Provider access is unavailable for this analyst.",
      403,
    );
  if (response.status === 429)
    throw new HttpError(
      "Analyst limit reached. Wait before trying again.",
      429,
    );
  if (response.status === 404)
    throw new HttpError(
      "No analyst profile or calls are available for this handle.",
      404,
    );
  if (!response.ok)
    throw new HttpError("Analyst temporarily unavailable.", 503);
  let raw: unknown;
  try {
    const reader = response.body?.getReader();
    if (!reader) throw Error();
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      size += r.value.length;
      if (size > 2000000) {
        await reader.cancel();
        throw Error();
      }
      chunks.push(r.value);
    }
    const bytes = new Uint8Array(size);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.length;
    }
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError("Analyst response could not be read safely.", 502);
  }
  const data =
    mode === "profile"
      ? personProfile(raw, slug)
      : personCalls(raw, slug, offset);
  if (!data)
    throw new HttpError("Analyst schema or identity is unsupported.", 502);
  return { data, source: "SentiSense", retrievedAt: new Date().toISOString() };
}
