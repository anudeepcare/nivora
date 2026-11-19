import { createHash } from "node:crypto";
/** Inactive evidence collector. Never returns a Pace stage or claims verified freshness. */
export type IndependentEvidenceRequest = {
  providerTicker: string;
  from: string;
  to: string;
  asOf: string;
};
type Reader = (
  path: string,
  params: Record<string, string>,
  ttl: number,
) => Promise<unknown>;
type Security = {
  providerTicker: string;
  venue: string;
  currency: "USD";
  type: "Common Stock";
  isDelisted: false;
};
type Daily = { date: string; close: number };
export type IndependentPriceEvidence = {
  status: "unavailable" | "evidence-only";
  readyForPace: false;
  stage: null;
  instruction: null;
  reason: string;
  security: Readonly<Security> | null;
  daily: ReadonlyArray<Readonly<Daily>>;
  provenance: {
    source: "EODHD";
    basis: "split-and-dividend-adjusted";
    originalFetchedAt: null;
    calendarVerified: false;
    businessEligibility: "unknown";
    readAt: string;
    evidenceHash: string | null;
  };
};
const date = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const venues = new Set([
  "NASDAQ",
  "NYSE",
  "NYSE ARCA",
  "NYSE AMERICAN",
  "AMEX",
  "NYSE MKT",
  "BATS",
  "CBOE",
]);
export function validIndependentEvidenceRequest(
  r: IndependentEvidenceRequest,
): boolean {
  return (
    !!r &&
    typeof r.providerTicker === "string" &&
    /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)?\.US$/.test(r.providerTicker) &&
    date(r.from) &&
    date(r.to) &&
    date(r.asOf) &&
    r.from <= r.to &&
    r.to <= r.asOf &&
    Date.parse(r.to) - Date.parse(r.from) <= 3660 * 86400000
  );
}
export function independentSecurityFrom(
  raw: unknown,
  ticker: string,
): Security | null {
  if (!object(raw)) return null;
  const g = object(raw.General) ? raw.General : raw;
  if (
    g.Code !== ticker.slice(0, -3) ||
    g.CurrencyCode !== "USD" ||
    g.Type !== "Common Stock" ||
    g.IsDelisted !== false ||
    typeof g.Exchange !== "string" ||
    !venues.has(g.Exchange)
  )
    return null;
  return {
    providerTicker: ticker,
    venue: g.Exchange,
    currency: "USD",
    type: "Common Stock",
    isDelisted: false,
  };
}
/** Pure payload gate shared by acquisition (before publish) and cache-hit paths. */
export function independentAdjustedRows(
  raw: unknown,
  request: IndependentEvidenceRequest,
): Daily[] | null {
  if (
    !validIndependentEvidenceRequest(request) ||
    !Array.isArray(raw) ||
    raw.length === 0 ||
    raw.length > 4000
  )
    return null;
  const daily: Daily[] = [];
  for (const row of raw) {
    if (
      !object(row) ||
      !date(row.date) ||
      row.date < request.from ||
      row.date > request.to ||
      (daily.length > 0 && row.date <= daily[daily.length - 1].date) ||
      typeof row.adjusted_close !== "number" ||
      !Number.isFinite(row.adjusted_close) ||
      row.adjusted_close <= 0 ||
      (row.code !== undefined && row.code !== request.providerTicker) ||
      (row.currency !== undefined && row.currency !== "USD")
    )
      return null;
    daily.push({ date: row.date, close: row.adjusted_close });
  }
  return daily;
}
/** Exactly one profile request and, only if supported, one history request.
 * Reader must be the existing authorized server path, not a browser callback.
 * Cache-origin timestamps are unavailable from that path, so readyForPace stays false.
 */
export async function collectIndependentPriceEvidence(
  read: Reader,
  input: IndependentEvidenceRequest,
): Promise<IndependentPriceEvidence> {
  const request = Object.freeze({ ...input });
  const finish = (
    status: IndependentPriceEvidence["status"],
    reason: string,
    security: Security | null = null,
    daily: Daily[] = [],
  ): IndependentPriceEvidence => {
    const evidenceHash = security
      ? createHash("sha256")
          .update(JSON.stringify({ request, security, daily }))
          .digest("hex")
      : null;
    return Object.freeze({
      status,
      readyForPace: false,
      stage: null,
      instruction: null,
      reason,
      security: security ? Object.freeze(security) : null,
      daily: Object.freeze(daily.map((p) => Object.freeze(p))),
      provenance: Object.freeze({
        source: "EODHD",
        basis: "split-and-dividend-adjusted",
        originalFetchedAt: null,
        calendarVerified: false,
        businessEligibility: "unknown",
        readAt: new Date().toISOString(),
        evidenceHash,
      }),
    });
  };
  if (!validIndependentEvidenceRequest(request))
    return finish(
      "unavailable",
      "A valid explicit US ticker and bounded date window (at most 3,660 days) are required.",
    );
  try {
    const profile = await read(
      `v1.1/fundamentals/${request.providerTicker}`,
      { filter: "General" },
      86400000,
    );
    const security = independentSecurityFrom(profile, request.providerTicker);
    if (!security)
      return finish(
        "unavailable",
        "Verified identity, supported venue, explicit non-delisted common-stock type and USD currency are required.",
      );
    const raw = await read(
      `eod/${request.providerTicker}`,
      { from: request.from, to: request.to, period: "d", order: "a" },
      900000,
    );
    const daily = independentAdjustedRows(raw, request);
    if (!daily)
      return finish(
        "unavailable",
        "Invalid, missing, conflicting or out-of-window adjusted-close evidence. No raw-close fallback is allowed.",
      );
    return finish(
      "evidence-only",
      "Price and security fields passed structural checks only. Original cache-fetch time, full exchange-session completeness and independent business eligibility remain unverified; no Pace input or signal is issued.",
      security,
      daily,
    );
  } catch {
    return finish(
      "unavailable",
      "Authorized provider evidence is unavailable. No fallback request or raw provider error is exposed.",
    );
  }
}
