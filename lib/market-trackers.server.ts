import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { trackerCatalog, trackerIds, trackerSnapshot } from "./market-trackers";
export async function readMarketTracker(
  id: string | null,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (id !== null && !trackerIds.includes(id))
    throw new HttpError("Unsupported tracker.", 400);
  if (!key) throw new HttpError("Tracker provider is not configured.", 503);
  await limit("sentisense:tracker-workspace", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/trackers${id ? `/${id}` : ""}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Tracker provider could not be reached.", 503);
  }
  if ([401, 403].includes(response.status))
    throw new HttpError(
      "Provider access is unavailable for this tracker.",
      403,
    );
  if (response.status === 429)
    throw new HttpError(
      "Tracker limit reached. Wait before trying again.",
      429,
    );
  if (response.status === 404)
    throw new HttpError(
      "No tracker snapshot is available. Try later; no replacement is shown.",
      404,
    );
  if (!response.ok)
    throw new HttpError("Tracker temporarily unavailable.", 503);
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
    throw new HttpError("Tracker response could not be read safely.", 502);
  }
  const data = id ? trackerSnapshot(raw, id) : trackerCatalog(raw);
  if (!data)
    throw new HttpError("Tracker schema or identity is unsupported.", 502);
  return { data, source: "SentiSense", retrievedAt: new Date().toISOString() };
}
