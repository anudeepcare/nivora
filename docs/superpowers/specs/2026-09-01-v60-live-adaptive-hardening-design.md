# NIVORA V60 Live Adaptive Hardening Design

## Goal
Turn V59 into a production-hardened decision platform whose displayed market state is session-aware and fresh, whose Discover coverage is measurable, and whose infrastructure exposes reliability rather than implying it.

## Invariants
- Preserve V59 company/thesis/opportunity/valuation scoring behavior unless an existing regression proves a defect.
- Price/session state is separate from company quality and long-term thesis.
- Missing/stale live data is labelled, never fabricated.
- Extended-hours moves may change Today/timing context but must not silently rewrite long-term conviction.
- Production rate limiting must not silently claim distributed protection when persistence is unavailable.
- Reliability remains evidence-driven and sample-size gated.

## Architecture
1. `nivora-market-session.ts` owns US market-session classification and quote freshness semantics.
2. `nivora-live-quote.ts` owns provider-neutral quote contracts and Twelve Data quote normalization.
3. `/api/quote/[symbol]` supplies low-latency pre/post-aware quotes independently of daily analysis candles.
4. Stock UI refreshes the quote surface frequently while retaining slower research/fundamental refreshes.
5. Discover exposes explicit <24h, <7d and <30d freshness distribution for the investment-ranked universe.
6. Provider resilience tracks request totals, errors, coalescing and latency per runtime; system health exposes it.
7. Production rate-limit fallback becomes explicit degraded state rather than being presented as distributed.
8. Decision-stability utilities quantify action flips and whether material evidence accompanied them.
9. V60 version strings and release docs make contracts auditable.

## Live-price behavior
A quote contains `price`, `regularClose`, `change`, `changePct`, `session`, `isExtendedHours`, `providerTimestamp`, `ageSeconds`, `freshness`, `provider`, and `isRealTime`. The UI labels PRE-MARKET, REGULAR, AFTER-HOURS, OVERNIGHT, CLOSED and STALE/LAST TRADE explicitly. No overnight quote is invented when the provider does not supply one.

## Adaptive scanning
V60 does not attempt to make a low-tier provider scan thousands of companies uniformly in real time. It measures freshness explicitly and provides prioritization primitives so positions/watchlist/material movers can be refreshed ahead of the long tail. Existing scoring remains unchanged.

## Observability
Provider health exposes calls, successes, failures, error rate, coalesced joins, latency and status. Discover exposes freshness cohorts. Reliability remains Arena-backed, never inferred from code quality.
