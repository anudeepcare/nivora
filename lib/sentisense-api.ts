import "server-only";
import { createHash } from "node:crypto";
import { HttpError, limit } from "./server";
import { createProviderCache } from "./provider-cache";

type Dependencies = {
  fetch?: typeof fetch;
  reserve?: typeof limit;
  now?: () => number;
  env?: () => Record<string, string | undefined>;
};
/** Server-only, GET-only documented API transport. Credentials never enter URLs. */
export function createSentiSenseApi(deps: Dependencies = {}) {
  const transport = deps.fetch ?? fetch;
  const reserve = deps.reserve ?? limit;
  const now = deps.now ?? Date.now;
  const environment = deps.env ?? (() => process.env);
  const cache = createProviderCache(512);
  const paused = new Map<string, number>();
  let reservationTail: Promise<void> = Promise.resolve();
  let lastStarted = -Infinity;
  return async function request(
    path: string,
    params: Record<string, string> = {},
    ttlSeconds = 60,
  ): Promise<unknown> {
    const env = environment();
    const key = env.SENTISENSE_API_KEY?.trim();
    if (!key || env.AURYN_SENTISENSE_MODE !== "pro")
      throw new HttpError("Market data connection is not configured.", 503);
    if (
      !/^[A-Za-z0-9._/-]+$/.test(path) ||
      path.includes("..") ||
      path.startsWith("/") ||
      path.startsWith("keys/")
    )
      throw new HttpError("Unsupported market dataset.", 400);
    const hash = createHash("sha256").update(`pro:${key}`).digest("hex");
    if ((paused.get(hash) ?? 0) > now())
      throw new HttpError(
        "Market data is temporarily rate limited or unavailable.",
        503,
      );
    const query = new URLSearchParams(
      Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
    );
    const ttl = Math.min(3600, Math.max(0, ttlSeconds)) * 1000;
    return cache(`${hash}:${path}?${query}`, ttl, async () => {
      if ((paused.get(hash) ?? 0) > now())
        throw new HttpError("Market data temporarily unavailable.", 503);
      // Same key namespaces as the paid target adapter; all requests share quota.
      const reservation = reservationTail.then(async () => {
        const wait = lastStarted + 275 - Date.now();
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        if ((paused.get(hash) ?? 0) > now())
          throw new HttpError("Market data temporarily unavailable.", 503);
        await reserve(`sentisense:${hash}:burst`, 4, 1000);
        await reserve(`sentisense:${hash}:minute`, 240, 60_000);
        lastStarted = Date.now();
      });
      reservationTail = reservation.catch(() => {});
      await reservation;
      let response: Response;
      try {
        response = await transport(
          `https://app.sentisense.ai/api/v1/${path}${query.size ? `?${query}` : ""}`,
          {
            headers: {
              "X-SentiSense-API-Key": key,
              Accept: "application/json",
            },
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.timeout(15_000),
          },
        );
      } catch {
        throw new HttpError("Market data request could not complete.", 503);
      }
      if ([401, 403, 429].includes(response.status)) {
        const header = response.headers.get("retry-after");
        const retry =
          header && /^\d+$/.test(header)
            ? now() + Number(header) * 1000
            : Date.parse(header || "");
        paused.set(
          hash,
          Math.max(now() + 60_000, Number.isFinite(retry) ? retry : 0),
        );
      }
      if (response.status === 202)
        throw new HttpError(
          "History is being prepared. Try again shortly.",
          503,
        );
      if (!response.ok)
        throw new HttpError(
          response.status === 404
            ? "This dataset is not covered for this instrument."
            : "Market data is temporarily unavailable.",
          response.status === 404 ? 404 : 503,
        );
      try {
        const value: unknown = await response.json();
        if (!value || typeof value !== "object") throw Error();
        return value;
      } catch {
        throw new HttpError(
          "The data source returned an invalid response.",
          503,
        );
      }
    });
  };
}
export const sentiSenseRequest = createSentiSenseApi();
