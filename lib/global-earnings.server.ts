import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { createHash } from "node:crypto";
const snapshots = new Map<
  string,
  { at: number; result: NonNullable<ReturnType<typeof globalEarnings>> }
>();
import { HttpError, limit } from "./server";
import { globalEarnings } from "./global-earnings";
import { readBoundedMarketJson } from "./market-response";
export async function readGlobalEarnings(
  window: { from: string; to: string },
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (!key)
    throw new HttpError("Earnings calendar provider is not configured.", 503);
  const cacheKey = `${createHash("sha256").update(key).digest("hex")}:${window.from}:${window.to}`;
  const cached = snapshots.get(cacheKey);
  if (cached && Date.now() - cached.at < 86400000) return cached.result;
  await limit("sentisense:global-earnings", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/calendar/earnings?${new URLSearchParams(window)}`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError(
      "Earnings calendar provider could not be reached.",
      503,
    );
  }
  if ([401, 403].includes(response.status))
    throw new HttpError(
      "The configured provider key cannot access this calendar.",
      403,
    );
  if (response.status === 429)
    throw new HttpError(
      "Calendar provider limit reached. Wait before trying again.",
      429,
    );
  if (!response.ok)
    throw new HttpError("Earnings calendar is temporarily unavailable.", 503);
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2 * 1024 * 1024);
  } catch {
    throw new HttpError("Calendar response could not be read safely.", 502);
  }
  const result = globalEarnings(raw, window, new Date().toISOString());
  if (!result)
    throw new HttpError(
      "Calendar response schema or date window is unsupported.",
      502,
    );
  if (snapshots.size >= 12) snapshots.delete(snapshots.keys().next().value!);
  snapshots.set(cacheKey, { at: Date.now(), result });
  return result;
}
