# Versioned origin-aware evidence path: scoped implementation plan

Status: design only. No changes to shared cache, provider transport, authentication, packages, database, endpoints or deployments. No provider calls. Existing inactive prototype/collector/inspector remain unchanged and unready for Pace.

## Why not a local timestamp patch

Actual repository inspection establishes four coupled boundaries:

1. `lib/eodhd.ts` caches `Promise<payload>` locally and uses Next fetch revalidation. A newly invoked callback may return older framework-cached bytes.
2. `lib/shared-market.ts` returns bare RPC payloads and bypasses shared budget/leases when `AURYN_SHARED_MARKET_GUARD` is disabled.
3. `auryn_market_publish` stores JSONB and publication `updated_at`, not verified provider receipt. Its boolean reports key/lease-token matching, not current unexpired ownership or durable payload storage: it does not check `lease_until`, and oversized JSONB payloads are silently nulled even when it returns true.
4. `account()` calls `guardAccess`, whose market licensing/feature checks are route-name-based. An unrelated new evidence route name would not automatically receive those checks. Shared cache hits must still be individually authorized.

A safe origin path requires coordinated transport, namespace, lease, envelope and authorization tests. Changing only one creates misleading freshness or entitlement behavior. The scoped-plan alternative is chosen rather than making a partial security-sensitive refactor during the inactive prototype milestone.

## Phase A: explicit server authorization boundary

Files: new `lib/independent-evidence-access.server.ts`; package/lockfile only if the framework's `server-only` marker must be installed. No route.

- Compile-time server-only boundary, tested by attempting a client import in an isolated build fixture. A filename or runtime window check is insufficient.
- Verify identity using `account(request, { market: false })` before cache access. Then call `requestAccess(request, user.id)` explicitly. Reject `sampleOnly`, require the independently chosen feature set (at least technicals, plus business for fundamental inputs and longHistory for long windows). Do not rely on the request URL matching `guardAccess`'s existing regex.
- Check request validity and feature policy before provider work. Apply `limit`, `allowMarketUser` and `reserveAccess` explicitly and exactly once, using the same canonical company key as ordinary research, rather than inventing a second billing item. Confirm desired feature coverage in the product policy before implementation; no entitlement is broadened.
- Require shared market protection to be enabled/configured for this evidence path, including in its production-like tests. Do not inherit the ordinary reader's unguarded fallback. Denial, unavailable auth, unavailable allowance and sample-only mode must return before a provider request or shared-data read.
- Keep the acquisition function internal. Do not accept caller-provided user IDs, feature flags, origin timestamps, reader callbacks or capabilities over the eventual HTTP interface. Never expose secrets or raw exception text.

Tests: missing/expired bearer token, database auth error, sample-only deployment, each denied feature, monthly/per-user rate limit, shared guard disabled, authorization on cache hits, and no double allowance reservation. Assert zero provider requests and no leaked cached data on denial. Authentication-service reads are not provider market-data calls.

## Phase B: namespaced budget/lease primitive, no semantic change to old readers

Files: `lib/shared-market.ts` plus tests; preferably no SQL migration. Existing generic JSONB payload supports a versioned envelope.

- Extract a private shared acquisition core accepting a server-owned cache namespace enum. Existing `sharedEodRead` passes the legacy empty namespace, retaining exactly its previous key, costs, payloads, retries and errors. A new internal evidence reader uses a fixed `independent-evidence-v1` namespace. Never send that namespace to EODHD as a query parameter.
- Compute the weighted cost from the original provider path/parameters using `eodCallCost`, not from the internal namespace. Preserve the same provider/account budget identity across both namespaces. Never reset quotas or add a second account budget.
- Require the shared guard for the new reader; support cached, reserved, paused, limited and wait outcomes explicitly. On successful acquisition, verify publication's boolean ownership result. A false return, expired/uncertain lease or publication error must fail closed. A true return is only token-match acceptance, not proof of persisted payload or a nonexpired lease; see the independent review corrections below.
- New and legacy namespaces can each acquire once and therefore can increase paid calls. Do not enable dual-loading or warm-up. Test this cost and require a deliberate activation decision. Source implementation/testing uses fake transport only.

Tests: existing shared-market PGlite tests unchanged and passing; legacy cache key/output snapshots; same weighted account budget for both namespaces; exactly one acquisition under concurrent callers; cache reuse; no acquisition on paused/limited/unknown quota; expired/stolen lease; publication failure; guarded versus legacy disabled-guard behavior. Avoid deployed database changes.

## Phase C: real response-origin envelope transport

Files: new `lib/independent-eod-envelope.server.ts`; narrowly extract reusable HTTP response validation from `lib/eodhd.ts` only if regression tests establish unchanged legacy errors/backoff behavior. No new route and no live calls.

- Allow only the fixed profile and bounded daily-history paths produced by validated US security requests. Resolve provider credentials inside the server boundary; never accept arbitrary URLs/headers/query keys from clients.
- Execute only inside a successful shared reservation. Use `fetch` with `cache: 'no-store'` and no Next `revalidate` option for this new evidence path. Existing ordinary fetch semantics remain untouched.
- On receipt of the provider response, record trusted server `responseReceivedAt`. Validate status, body size, JSON, nonempty expected shape and identity, then deep-clone/freeze canonical JSON. Preserve provider observation dates separately. Receipt from a provider/CDN is not proof that its financial data is current.
- Use a versioned envelope containing schema version, canonical request identity without credentials, immutable data snapshot, canonical hash, response receipt, expiry and adjustment provenance. Do not copy arbitrary metadata from the provider body into trusted envelope fields.
- Preserve the exact envelope and receipt timestamp through shared/local caches. Legacy payloads remain unknown and are not promoted. Never derive origin from SQL publication time, current read time or a hash alone.
- Preserve status-specific provider handling: authorization denied, rate limit and Retry-After, malformed response and timeout. Reuse existing account pause protection. No automatic fallback to an older endpoint or raw/unadjusted prices in this path.

Tests with fake fetch/clock: only reserved callback fetches; cache option excludes framework cache; repeated reads preserve receipt; responseReceivedAt versus observation date distinction; stale payload received recently; future clock; immutable snapshot tamper attempt; hash binding through JSONB key reordering; 401/403/402/429/5xx; timeout; invalid/oversized JSON; lost publication lease; credential redaction; no endpoint fallback; bounded request count. Check existing legacy EOD tests for unchanged behavior.

## Phase D: connect only the inactive evidence collector

Files: `lib/independent-pace-adapter.server.ts`, provenance inspector and tests as needed. Keep all routes/components unchanged.

- Replace the collector's bare-reader binding with the authorized namespaced envelope reader only inside this inactive server boundary. Do not expose a client route or run collection.
- Pass immutable snapshot and cache-owned metadata to inspection; retain the inspected snapshot rather than the caller's mutable payload reference. Distinguish authenticated receipt age from calendar/observation completeness.
- Keep `readyForPace: false`, null stage/instruction and unknown business eligibility. Even genuine receipt provenance does not resolve session completeness, business policy, revised fundamentals or investment validation.
- Run the full suite, type/lint/format, isolated server-only boundary build and independent security/provenance audit. Verify no runtime consumers and no provider calls in tests.

## Explicit release gates and estimated work

The above source-only boundary/transport work is roughly 6–10 focused engineering hours including local lease/concurrency and authorization regression coverage, assuming existing access and build-test helpers can be reused. This is an estimate, not a deployment promise. If safely extracting existing HTTP behavior broadens scope, stop and split the review rather than duplicating unaudited token/error code.

Only after independent review may a separately authorized smoke test spend a small stated provider-call budget on existing entitled datasets. No new subscription is implied. No endpoint activation follows automatically. A complete session calendar, publication-completion rules, independent business policy, policy parameter decisions and financial/out-of-sample validation remain separate blockers to a working Pace signal.


## Independent plan review corrections and minimal seams

The reviewer confirmed the isolated-new-modules constraint blocks trustworthy reuse: private budget helpers and a non-namespaced shared reader cannot safely be duplicated or bypassed. A narrowly reviewed shared-core seam is needed; no such edit has been made.

### Publication is not a durability or lease-freshness proof

The current SQL publish function returns `found` for matching key/token even when `pg_column_size(p_value) > 5,242,880` causes the stored payload to be null. It also matches only key/token, not `lease_until`; an expired-but-not-replaced lease can publish. Therefore neither successful RPC transport nor returned `true` establishes durable content or current lease validity. Do not label it published/verified solely on that basis.

A no-migration evidence implementation must keep explicit conservative byte/cardinality/depth limits, reject a locally expired/uncertain reservation before publication, and treat `true` only as ownership-token acceptance. A JSON wire-size check is not an exact JSONB-size guarantee. If persistence/current-lease proof is required, withhold it until an authoritative database contract exists, rather than acquiring the same key again (which could reserve another paid call).

The strongest minimal database seam is a separately versioned evidence publish RPC, leaving the legacy RPC untouched. It must atomically require matching key/token AND `lease_until > clock_timestamp()`, validate actual JSONB size before publishing, return explicit `stored` plus the accepted expiry/receipt metadata, and fail without certifying storage on size, lease or ownership failure. Use service-role-only permissions identical to the existing private-cache boundary. Add PGlite tests for just-under/over size limit, expired-but-not-stolen lease, stolen lease, false/error outcomes, unchanged legacy behavior and unauthorized roles. This is a proposed migration requiring independent review, not a change authorized by the current isolated-only milestone.

### Account-usage snapshot must be keyed to provider credentials

`accountUsage` currently has one process-wide `usage` variable, not a token-keyed entry. A later call using a different provider token can receive the first token's usage/limit snapshot. The shared database provider key is token-hashed, but that does not repair the upstream usage snapshot. The new evidence path must not certify account quota from this singleton across credential identities.

The minimal tested core seam is a bounded usage-snapshot map keyed by the same internal credential identity, with unchanged TTL/date behavior per identity. Never expose that hash to clients. Tests must alternate two tokens with different limits/usage and ensure each account's cap and remote-used values remain isolated; include token rotation, usage-unavailable, midnight rollover and bounded-map eviction. Since this changes an existing private helper, it needs explicit shared-core ownership and full regression review. Do not duplicate `accountUsage` into an isolated module with a second incompatible quota mechanism.

### Required authorization before implementation resumes

Allow the narrowly scoped shared-core namespace and token-keyed usage seams to be edited under tests/review; decide whether authoritative evidence-publication guarantees require the separate versioned RPC. Until those seams are approved, the safe deliverable is this plan, not another reader that appears trusted. No metadata producer, paid fetch, shared-cache edit, database migration or endpoint has been implemented. All inactive consumers still withhold Pace readiness.

## Authorized Phase B source implementation (not activated)

The parent authorized the narrow shared-core seam after the above design review. `shared-market.ts` now retains the legacy public reader through a private shared core and introduces an unused `sharedEodEvidenceRead` with a fixed independent namespace, identical account identity/weighted cost, required shared guard and strict evidence-publisher acceptance. The legacy key format, legacy publisher and disabled-guard fallback remain unchanged. The existing usage snapshot is now a bounded map keyed by credential identity, retaining the same per-entry TTL/date rules. This fixes cross-token cache reuse; it does not claim that separate tokens belonging to one real provider account have been unified into a single provider identity.

`docs/sql/market_evidence_publish_v1.sql` is a SOURCE-ONLY candidate SQL definition, not an applied/generated migration. The Supabase CLI is absent from this workspace; no timestamped migration filename was invented. The candidate is exercised against local PGlite only. It uses security invoker, empty search_path and service-role-only execute permission, enforces current key/token/lease deadline atomically with update, rejects actual JSONB payloads above 5 MiB without claiming storage, and reports stored/expiry explicitly. Matching reservation cleanup reports released, never stored. The legacy RPC is untouched.

Tests cover two-token isolation and reuse, midnight/failed-usage expiry, bounded token-map eviction, exact legacy key preservation, equal namespace cost/account identity, fail-closed disabled evidence guard, publication rejection, cache hits, paused/limited states, strict SQL size/expired/stolen lease handling and unauthorized roles. Further authorization/origin transport work remains gated on independent phase review. No evidence route or runtime consumer exists and no provider calls or deployed database changes occurred.

## Authorized inactive origin boundary implementation

`independent-evidence-origin.server.ts` now implements the server-only authenticated origin boundary in source. It verifies the account, explicitly requires enabled access controls and shared guard, rejects sample-only licensing, requires technicals (and longHistory beyond 366 days), checks request/rate/daily/monthly allowances, then uses the versioned shared evidence seam. The earlier inactive adapter server entry now delegates to this same authenticated boundary instead of offering a bare-provider alternative. Existing production routes/readers are not switched.

The new shared seam first performs a non-mutating invalid-argument capability probe of the evidence RPC. If that source-only SQL has not been applied or is inaccessible, it stops before account-usage/provider acquisition. No deployed database was changed, so the unused path is intentionally not presumed operational.

Only a reserved callback performs the fixed EODHD fetch using no-store, no Next revalidation option, redirect:error and a 15-second signal. Body parsing is bounded to 2 MiB and snapshots to 100,000 nodes/64 levels. It records server receipt time separately from market observation time. Provider 402/429 responses trigger existing pause protection; errors and malformed/oversized responses are sanitized without endpoint fallback. Profile identity/type and adjusted-price structure are validated BEFORE the callback returns for publication, preventing invalid responses from poisoning the versioned cache.

On every fresh or cached envelope, it takes an immutable snapshot, checks schema/request identity/hash/receipt age/expiry, revalidates expected profile/daily structure, then exposes a frozen receipt record. Legacy, altered, stale, future or wrong-identity envelopes fail without refresh fallback. Valid receipt provenance still does not establish current exchange-session completeness or investment eligibility; output remains readyForPace:false and no stage/instruction.

Verification includes synthetic acquisition and cache-hit tests, denied auth/licensing/features/quota/guard, malformed/oversized/error responses, rate-limit pause, pre-publication wrong-symbol/malformed-row rejection, receipt retention and hash-consistent wrong-identity cache rejection. An isolated Next client-import fixture fails with the explicit server-only compiler diagnostic, as required. Next's installed compiler provides this marker without installing a dependency; see [official server/client guidance](https://nextjs.org/docs/app/getting-started/server-and-client-components). No production component or route imports the modules; no live provider request, secret upload, SQL deployment or feature activation occurred.
