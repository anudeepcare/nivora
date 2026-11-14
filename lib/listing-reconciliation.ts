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
  shares: number | null;
  sharesAsOf: string | null;
  basis: "reported-share-bridge" | "market-cap-reconciled" | null;
} {
  const missing = (detail: string) => ({
    status: "missing" as const,
    detail,
    referencePrice: null,
    asOf: null,
    differencePct: null,
    shares: null,
    sharesAsOf: null,
    basis: null,
  });
  const cap = r.evidence?.highlights?.MarketCapitalization;
  const shares = r.evidence?.ownership?.outstanding;
  const observations = r.evidence?.listingObservations;
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  if (!observations) {
    const reported = r.evidence?.reportedShareObservation,
      shareTime = Date.parse(reported?.asOf ?? ""),
      knowledge = Date.parse(reported?.observedAt ?? ""),
      quoteTime = Date.parse(r.quote.asOf ?? "");
    const sourceValid = (() => {
      try {
        const u = new URL(reported?.sourceUrl ?? "");
        return u.protocol === "https:" && !u.username && !u.password;
      } catch {
        return false;
      }
    })();
    if (
      reported &&
      reported.securityType === "ordinary-common" &&
      !r.company.foreignListing &&
      r.company.assetType === "stock" &&
      reported.shareBasis === r.company.symbol &&
      reported.unit === "shares" &&
      positive(reported.value) &&
      positive(r.quote.price) &&
      r.quote.currency === r.company.currency &&
      r.evidence?.reportingCurrency === r.quote.currency &&
      sourceValid &&
      Number.isFinite(now) &&
      Number.isFinite(shareTime) &&
      Number.isFinite(knowledge) &&
      shareTime <= knowledge &&
      knowledge <= now &&
      now - shareTime <= 120 * 86400000 &&
      Number.isFinite(quoteTime) &&
      quoteTime <= now + 60000 &&
      now - quoteTime <= 4 * 86400000 &&
      !r.quote.stale &&
      (!positive(shares) || Math.abs(shares / reported.value - 1) <= 0.1)
    )
      return {
        status: "available",
        basis: "reported-share-bridge",
        shares: reported.value,
        sharesAsOf: reported.asOf,
        referencePrice: r.quote.price,
        asOf: r.quote.asOf!,
        differencePct: null,
        detail: `Calculated share bridge: ${reported.value.toLocaleString("en-US")} reported ordinary shares at ${reported.asOf}, observed ${reported.observedAt}, paired with the quote at ${r.quote.asOf}. Dates differ; subsequent issuance or buybacks may change the count. This is not market-cap reconciliation or an audit.`,
      };
    return missing(
      "A recent dated ordinary-share observation with matching listed-share units and currency is unavailable or conflicts with supplied shares. Foreign/ADR ratios, split changes and observations older than 120 days require reconciliation; an undated market-cap/share snapshot is not a substitute.",
    );
  }
  if (!positive(cap) || !positive(shares))
    return missing(
      "Positive finite market capitalization and outstanding shares are required for share-dependent calculations.",
    );
  const reference = observations.price ?? {
    value: r.quote.price,
    asOf: r.quote.asOf,
    currency: r.quote.currency,
    shareBasis: r.company.symbol,
  };
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
  // Matching one another does not make an old snapshot current. Apply the
  // same share-age limit as the independently reported-share bridge above.
  if (now - stamps[0] > 120 * 86400000)
    return missing(
      "The matched market-cap/share/price snapshot is older than 120 days. Recent listed-share observations are required for current per-share scenarios.",
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
    shares: conflicting ? null : shares,
    sharesAsOf: observations.shares.asOf,
    basis: "market-cap-reconciled",
  };
}
