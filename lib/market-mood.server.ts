import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import { moodKinds, moodSnapshot, type MoodKind } from "./market-mood";
const endpoints: Record<MoodKind, string> = {
  mood: "/api/v2/market-mood?days=90",
  sectors: "/api/v1/sentiment/sectors",
  breadth: "/api/v1/sentiment/breadth",
};
const cache = new Map<
  string,
  {
    until: number;
    value: Promise<
      NonNullable<ReturnType<typeof moodSnapshot>> & { retrievedAt: string }
    >;
  }
>();
let pausedUntil = 0;
export async function readMarketMood(kind: MoodKind) {
  if (!moodKinds.includes(kind))
    throw new HttpError("Select a supported market view.", 400);
  const key =
    process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN;
  if (!key) throw new HttpError("Market context is not configured.", 503);
  const old = cache.get(kind);
  if (old && old.until > Date.now()) return old.value;
  if (Date.now() < pausedUntil)
    throw new HttpError(
      "Source temporarily rate-limited. Try again later.",
      429,
    );
  const value = (async () => {
    await limit("sentisense:market-mood", 20);
    let response: Response;
    try {
      response = await sentisenseFetch(
        `https://app.sentisense.ai${endpoints[kind]}`,
        {
          headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(12000),
        },
        fetch,
      );
    } catch {
      throw new HttpError("Market context source could not be reached.", 503);
    }
    if (response.status === 429) {
      const retry = Number(response.headers.get("Retry-After"));
      pausedUntil =
        Date.now() +
        Math.max(60, Math.min(3600, Number.isFinite(retry) ? retry : 60)) *
          1000;
      throw new HttpError(
        "Source temporarily rate-limited. Try again later.",
        429,
      );
    }
    if ([401, 403].includes(response.status))
      throw new HttpError(
        "This market dataset is not authorized by the source.",
        403,
      );
    if (!response.ok)
      throw new HttpError(
        "Market context unavailable. No replacement data is shown.",
        503,
      );
    let raw: unknown;
    try {
      raw = await readBoundedMarketJson(response, 2000000);
    } catch {
      throw new HttpError("Market response could not be read safely.", 502);
    }
    const data = moodSnapshot(raw, kind, Date.now());
    if (!data)
      throw new HttpError("Market response schema is unsupported.", 502);
    return { ...data, retrievedAt: new Date().toISOString() };
  })();
  cache.set(kind, { until: Date.now() + 300000, value });
  try {
    return await value;
  } catch (error) {
    if (cache.get(kind)?.value === value) cache.delete(kind);
    throw error;
  }
}
