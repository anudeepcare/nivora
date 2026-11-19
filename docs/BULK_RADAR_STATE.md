# Opt-in EODHD bulk radar persistence

Migration: `20261118102559_auryn_bulk_radar_state.sql`. This artifact has not been applied to a hosted database. Install it before enabling the opt-in bulk worker. Missing storage fails with an actionable migration message; this does not change the legacy radar path while bulk mode is off.

## State and privacy

The service-only `auryn_bulk_radar_state` stores public US market data, keyed by a SHA-256 credential scope and symbol. It stores no user IDs, portfolios, watchlists, raw credentials, arbitrary provider response, or financial account data. RLS is enabled, anonymous/authenticated access is revoked, and every RPC is security-invoker with fixed search path and service-role-only execution. Route ownership and saved-universe filtering remain the caller's responsibility. Credential changes intentionally isolate cached data.

One generation includes at most 160 raw OHLCV bars and 256 split events, the original history/actions acquisition instants, observed/checked dates and policy. The complete JSON is bounded to 256 KiB and allows only closed structured keys. Raw bars remain raw; split corrections replace the complete raw/actions generation rather than cumulatively mutating previously adjusted history. Full storage reads and writes invoke the actual pure snapshot validator; metadata-only reads validate dates and acquisition instants. The pure pipeline validates financial values and computes split-only derived candles. Storage does not claim dividend-adjusted or total-return prices.

## Concurrency and failure

Claim atomically leases a credential/symbol for 90 seconds and returns a random token plus current revision. Publish requires that exact live token and expected revision, swaps the whole snapshot, increments revision, and clears the lease. Repeating a publish cannot apply twice. An expired owner cannot publish after a successor reclaims the work.

Fail accepts only neutral enumerated issue codes and a retry instant within one day, retains the last good generation and revision, and clears the live matching lease. Reads never imply a failed or old generation is fresh: the worker must check original provenance and current status. Source acquisition and downstream publication are not a distributed transaction; a crash can consume provider budget without publishing. Existing shared EODHD request budget/cache controls remain authoritative and must account for the documented bulk cost before each read. There is no second competing cost ledger.

## Bounded reads and retention

Full and metadata-only reads accept at most 1,000 requested symbols, use ordered 100-row ranges, advance by actual returned count, and probe until empty. This prevents smaller PostgREST row caps being mistaken for missing records. A hard limit of 32 database page requests fails explicitly rather than returning partial results as complete. Metadata listing projects only provenance, not all histories. The authenticated route must page user-visible data and cannot expose the credential scope.

`auryn_bulk_radar_prune()` explicitly removes at most 1,000 rows inactive for more than 30 days, excluding live leases. No schedule is installed or enabled. Operators can call it from approved maintenance; without such calls retention is not automatically enforced. Old raw data is rebuildable public market data. Active/retried rows update activity time. Provider cache/cost retention is governed by the existing shared EODHD mechanism, not this table.

## Verification limits

Tests execute the actual SQL in embedded PGlite for lease exclusion/reclaim, stale writes, CAS idempotency, split corrections, last-good retention/retry, role denial, bounds, provenance, privacy keys, and bounded cleanup. Wrapper tests cover missing migration errors, fencing parameters, scope/selection bounds and capped paging/metadata projection. Embedded promise execution is not hosted multiprocess load testing. No production access, provider calls, migration application, scheduler creation or deployment occurred.


## Durable source cooldown follow-up

Also install `20261118110617_auryn_bulk_radar_source_cooldown.sql` before enabling the updated worker. The private `auryn_bulk_radar_source` table stores only credential hash, target source session date and expiry. A failed shared daily fetch can pause all subsequent workers for that same credential/session, including GET/reload; unrelated symbols and user navigation cannot reset it. Pauses monotonically extend via atomic upsert and expire by database time. The RPC rejects future session dates and pauses longer than one day. Per-route/provider budget and leases still apply, and the worker must call the read before provider reservation.

The service-only `auryn_bulk_radar_source_prune()` removes at most 1,000 expired pauses. It never removes an active pause. No automatic cleanup schedule is created. A new credential or a different target session is a separate bucket; this does not claim a provider-account-wide cross-key cooldown.

Tests execute monotonicity, expiry, date/scope isolation, service/anonymous/authenticated privileges, retry bounds and explicit retention against actual PGlite SQL. Wrapper tests validate dates and returned expiry without exposing raw database/provider error details.
