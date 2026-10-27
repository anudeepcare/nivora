import type { Research } from "./types";

const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/** Compare only explicitly dated, same-listing observations. The existing 10%
 * tolerance is a consistency heuristic, not a validated error probability.
 * Unknown dates never become a conflict with today's price. */
export function listingReconciliation(r: Research): {
  status: "available" | "missing" | "conflicting";
  detail: string;
  referencePrice: number | null;
  asOf: string | null;
  differencePct: number | null;
} {
  const missing = (detail: string) => ({
    status: "missing" as const,
    detail,
    referencePrice: null,
    asOf: null,
    differencePct: null,
  });
  const cap = r.evidence?.highlights?.MarketCapitalization;
  const shares = r.evidence?.ownership?.outstanding;
  if (!positive(cap) || !positive(shares))
    return missing(
      "Positive finite market capitalization and outstanding shares are required for share-dependent calculations.",
    );
  const observations = r.evidence?.listingObservations;
  if (!observations)
    return missing(
      "Field-specific market-cap and share observation dates and listed-share units are unavailable; comparison with the current price would be unreliable.",
    );
  const reference = observations.price ?? {
    value: r.quote.price,
    asOf: r.quote.asOf,
    currency: r.quote.currency,
    shareBasis: r.company.symbol,
  };
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  const stamps = [
    observations.marketCap.asOf,
    observations.shares.asOf,
    reference.asOf,
  ].map((value) => Date.parse(value ?? ""));
  if (
    !Number.isFinite(now) ||
    stamps.some((stamp) => !Number.isFinite(stamp) || stamp > now) ||
    stamps.some((stamp) => stamp !== stamps[0]) ||
    !positive(reference.value) ||
    observations.marketCap.currency !== reference.currency ||
    reference.currency !== r.quote.currency ||
    observations.shares.unit !== "shares" ||
    [
      observations.marketCap.shareBasis,
      observations.shares.shareBasis,
      reference.shareBasis,
    ].some((basis) => basis !== r.company.symbol)
  )
    return missing(
      "Market cap, shares and price need the same observation time, currency and explicit listed-share basis before they can be reconciled.",
    );
  const equity = shares * reference.value;
  if (!positive(equity))
    return missing(
      "Share and price inputs do not produce a finite positive capitalization.",
    );
  const differencePct = (cap / equity - 1) * 100;
  const conflicting = Math.abs(differencePct) > 10;
  return {
    status: conflicting ? "conflicting" : "available",
    detail: conflicting
      ? `Dated ${reference.asOf}: capitalization differs from listed shares × the matching price by ${Math.abs(differencePct).toFixed(1)}%. Share-dependent calculations need review; reported operating results are unaffected.`
      : `Dated ${reference.asOf}: market cap, listed shares and the matching price reconcile within the 10% consistency check. This is not an audit.`,
    referencePrice: reference.value,
    asOf: reference.asOf!,
    differencePct,
  };
}
