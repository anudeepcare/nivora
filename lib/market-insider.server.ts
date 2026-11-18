import { sentisenseFetch } from "./sentisense-provider.server";
import "server-only";
import { createHash } from "node:crypto";
const snapshots = new Map<
  string,
  { at: number; result: NonNullable<ReturnType<typeof marketInsider>> }
>();
// Only public provider DTO work is shared; route account checks remain per request.
const pending = new Map<
  string,
  Promise<NonNullable<ReturnType<typeof marketInsider>>>
>();
import { HttpError, limit } from "./server";
import { marketInsider } from "./market-insider";
import { readBoundedMarketJson } from "./market-response";
export async function readMarketInsider(
  days: number,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (![30, 90].includes(days))
    throw new HttpError("Choose 30 or 90 days.", 400);
  if (!key)
    throw new HttpError("Insider activity provider is not configured.", 503);
  const cacheKey = `${createHash("sha256").update(key).digest("hex")}:${days}`;
  const cached = snapshots.get(cacheKey);
  if (cached && Date.now() - cached.at < 900000) return cached.result;
  const active = pending.get(cacheKey);
  if (active) return active;
  const operation = Promise.resolve().then(async () => {
    await limit("sentisense:market-insider", 20);
    let response: Response;
    try {
      response = await sentisenseFetch(
        `https://app.sentisense.ai/api/v1/insider/activity?lookbackDays=${days}`,
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
        "Insider activity provider could not be reached.",
        503,
      );
    }
    if ([401, 403].includes(response.status))
      throw new HttpError(
        "The configured provider key cannot access this insider activity.",
        403,
      );
    if (response.status === 429)
      throw new HttpError(
        "Insider activity provider limit reached. Wait before trying again.",
        429,
      );
    if (!response.ok)
      throw new HttpError("Insider activity is temporarily unavailable.", 503);
    let raw: unknown;
    try {
      raw = await readBoundedMarketJson(response, 2 * 1024 * 1024);
    } catch {
      throw new HttpError(
        "Insider activity response could not be read safely.",
        502,
      );
    }
    const result = marketInsider(raw, days, new Date().toISOString());
    if (!result)
      throw new HttpError(
        "Insider activity response schema or date window is unsupported.",
        502,
      );
    if (snapshots.size >= 12) snapshots.delete(snapshots.keys().next().value!);
    snapshots.set(cacheKey, { at: Date.now(), result });
    return result;
  });
  pending.set(cacheKey, operation);
  try {
    return await operation;
  } finally {
    if (pending.get(cacheKey) === operation) pending.delete(cacheKey);
  }
}
