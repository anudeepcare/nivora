# NIVORA V60 — Live Adaptive Hardening

V60 is a production-hardening release. It deliberately preserves the V59 thesis/valuation weight versions while replacing several prototype assumptions around market freshness, operational observability, and live decision timing.

## Live market state
- Added a provider-neutral live quote contract and explicit PRE-MARKET / REGULAR / AFTER-HOURS / CLOSED session classification in America/New_York.
- Added `/api/quote/[symbol]` using Twelve Data `/quote` with `prepost=true`, 5-second shared cache and in-flight request coalescing.
- Stock detail now refreshes live quote state every 10 seconds independently of daily-candle analysis and labels session, freshness, source and quote age.
- No overnight stock price is fabricated. Closed/unsupported periods are reported as last-trade/stale state.
- A >=8% live extended-hours gap blocks BUY/ADD chasing by converting the Today action to WAIT/HOLD while leaving the long-term company/thesis decision unchanged.

## Discover freshness
- Discover now reports investment-universe freshness distributions for <24h, <7d and <30d plus stale-over-30d counts and percentages.
- Existing private portfolio/watchlist prioritization in the thesis-first scanner is retained; long-tail names continue stale-first rather than alphabetical batching.

## Provider and rate-limit observability
- Provider resilience now records logical requests, coalesced joins, successes/failures, consecutive failures, average/last latency and error rate.
- Shared upstream fetches automatically record provider results.
- `/api/system/health` exposes runtime provider health, version contracts, redundancy and rate-limiter configuration.
- Production local rate-limit fallback is explicitly labelled `DEGRADED_LOCAL_FALLBACK`; it is no longer presented as equivalent to distributed protection.

## Decision stability
- Added transition classification (`STABLE`, `EVIDENCE_CHANGE`, `NOISE_FLIP`) and action-flip/unexplained-flip metrics for Arena/operational analysis.

## Version contract
- Engine/infrastructure version: `v60`
- Thesis weights: `v59-thesis-1` (intentionally frozen)
- Valuation: `v59-archetype-3` (intentionally frozen)
- Today live policy: `v60-live-today-1`
- Live quote schema: `v60-live-quote-1`

## Evidence rule
V60 improves market/session correctness and observability. It does not claim predictive reliability merely because the infrastructure is better; Arena remains sample-size gated and must earn model reliability from frozen forward outcomes.
