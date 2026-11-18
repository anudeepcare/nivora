import { createHash } from "node:crypto";
/** Source-only sideband metadata validation. Does not alter existing caches or
 * authenticate a provider. Legacy entries must remain unknown. */
export function cachePayloadHash(value: unknown): string | null {
  const active = new WeakSet<object>();
  const canonical = (v: unknown): unknown => {
    if (v === null || typeof v === "string" || typeof v === "boolean") return v;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v !== "object" || !v || active.has(v))
      throw Error("Not finite JSON");
    active.add(v);
    let result: unknown;
    if (Array.isArray(v)) result = Array.from(v, canonical);
    else {
      if (
        Object.getPrototypeOf(v) !== Object.prototype &&
        Object.getPrototypeOf(v) !== null
      )
        throw Error("Not plain JSON");
      result = Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, canonical((v as Record<string, unknown>)[k])]),
      );
    }
    active.delete(v);
    return result;
  };
  try {
    return createHash("sha256")
      .update(JSON.stringify(canonical(value)))
      .digest("hex");
  } catch {
    return null;
  }
}
function timestamp(v: unknown): number | null {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/.test(
      v,
    )
  )
    return null;
  const n = Date.parse(v);
  return Number.isFinite(n) &&
    new Date(n).toISOString().slice(0, 10) === v.slice(0, 10)
    ? n
    : null;
}
export type CacheEvidenceInspection<T> = {
  payload: T;
  status: "unknown" | "invalid" | "stale" | "within-declared-window";
  declaredFetchedAt: string | null;
  mayUseForPace: false;
  reason: string;
};
/** Metadata must be separate cache-owned sideband, never inferred from provider
 * payload fields. Even valid hashes/timestamps are not proof of network origin.
 * maxAgeMs is mandatory and consumer-defined, not a hidden policy default.
 */
export function inspectCacheEvidence<T>(
  payload: T,
  metadata: unknown,
  requestKey: string,
  now: string,
  maxAgeMs: number,
): CacheEvidenceInspection<T> {
  const result = (
    status: CacheEvidenceInspection<T>["status"],
    reason: string,
    declaredFetchedAt: string | null = null,
  ): CacheEvidenceInspection<T> =>
    Object.freeze({
      payload,
      status,
      reason,
      declaredFetchedAt,
      mayUseForPace: false,
    });
  if (metadata === null || metadata === undefined)
    return result(
      "unknown",
      "Legacy cache evidence has no origin timestamp. Read or publish time is not substituted.",
    );
  if (typeof metadata !== "object" || Array.isArray(metadata))
    return result("invalid", "Invalid cache-owned sideband metadata.");
  const m = metadata as Record<string, unknown>,
    fetched = timestamp(m.fetchedAt),
    expires = timestamp(m.expiresAt),
    clock = timestamp(now);
  if (
    m.version !== 1 ||
    m.origin !== "provider-network" ||
    typeof requestKey !== "string" ||
    requestKey.length === 0 ||
    m.requestKey !== requestKey ||
    fetched === null ||
    expires === null ||
    clock === null ||
    fetched > clock ||
    expires <= fetched ||
    !Number.isFinite(maxAgeMs) ||
    maxAgeMs <= 0
  )
    return result(
      "invalid",
      "Identity, origin declaration, UTC timestamps or explicit maximum age are invalid.",
    );
  const fingerprint = cachePayloadHash(payload);
  if (!fingerprint || m.payloadHash !== fingerprint)
    return result(
      "invalid",
      "Payload fingerprint does not match the cache-owned metadata.",
    );
  const declaredFetchedAt = m.fetchedAt as string;
  if (clock >= expires || clock - fetched >= maxAgeMs)
    return result(
      "stale",
      "Declared origin age or cache expiry exceeds the allowed window; it is not refreshed by reading.",
      declaredFetchedAt,
    );
  return result(
    "within-declared-window",
    "Declared metadata is internally consistent only. Network-origin authentication and downstream calendar/eligibility checks remain required.",
    declaredFetchedAt,
  );
}
