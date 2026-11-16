# Independent paid provider review

Review uses current source and mocked/local PGlite tests, not live vendor payloads. No deployment or database migration application performed.

## Verified
- Paid access requires exact server-only pro mode, authenticated caller and hosted Preview/Production; unknown mode fails closed. The independent target endpoint authenticates and applies the existing market/account guard, requestAccess feature check, and per-user request limit before fetching. Base research retains its separate research reservation. Prior trial gate remains owner-only and time-bounded.
- Paid key identity hashes `pro:` plus key, unlike trial hash(key), isolating cached/pending work and denial/rate namespaces even with identical raw credentials. Credentials remain request headers only; fixed host, redirect rejection and no-store remain.
- Successful paid cache expires within one hour, independently revalidates symbol/currency/band/source/freshness. Shared read is required even for warm successes; unavailable read RPC fails closed before transport. Physical expired-row cleanup remains opportunistic.
- Denial/uncertain transport keeps a 15-minute latch;429 may extend with Retry-After using nonce-bound updates; known successful requests release only their own ticket. No auto-retry loop.
- No provider code deploys, applies migrations, configures environment flags, or purchases anything.

## Final reread: corrected findings
- Paid quota now reserves4/1000ms plus240/60000ms, compatible with the actual SQL limiter; local queue retains250ms spacing. Provider adds a real PGlite quota regression.
- Paid stripping now precedes the unsupported asset/currency return and preserves the caller input.
- Paid requests use a bounded abort wrapper stored in the pending map. Same-symbol concurrent callers share that wrapper, not raw work. The dedicated authenticated target endpoint calls `getSentiSenseTargets` with a 20-second provider budget; generic client calls default to three seconds. The endpoint declares a 30-second hosting duration. Account/access/database steps before provider invocation are not covered by the provider timer.
- Availability is checked before/after queue waits, quota reservation and guard claims. Transport receives the abort signal; late cache completion cannot start upstream after cancellation. Previously issued database calls and cleanup may still finish after the response deadline.

## Independent endpoint and client review
- `/api/analyst-targets/[symbol]` calls verified `account(request, {market:true})`, then `requestAccess`, then `canReadAnalystTargets`; no owner-only paid gate was introduced. Allowed research feature flags are analysts, overview, value, or advanced. Owner bypass excludes preview mode; disabled enforcement is a development-only access-server condition. Account verification still applies.
- Exact server mode `pro` and hosted preview/production are required. Missing/unknown mode and slash symbols do not invoke paid transport. Rate and access failures return private, no-store responses; credentials and raw vendor errors are not projected.
- Base research makes no paid vendor calls. Its previous trial enrichment only runs with absent mode, owner status and preview flag; `projectResearch` still strips owner-trial targets for nonowners. Dedicated paid responses are normalized before output and cannot read trial cache namespaces.
- Client targets load independently of base research. Merge requires enabled response, exact matching symbol, stock/USD identity, and valid fresh targets; a newer existing observation wins. Merge creates a new research object and does not mutate financial data, quote, source metadata, or snapshot clocks. This is not a blanket refresh of the financial dataset.

## Final acceptance and limitations
No remaining code blocker found in the reviewed provider/cache/endpoint scope. The prior coalesced deadline finding is resolved. Independently reran provider, cache, targets, route and independent-target suites: **52 tests passed, zero failures** (2026-11-16; `/tmp/paid-final-review.log`). Includes concurrent stalled-cache cancellation, late completion with no outbound traffic, in-flight abort, quota SQL contract, namespace separation, access denial and nonmutating merge checks.

This is source and fixture/local-database verification, not live provider coverage, DCA parity, screenshot acceptance, or production readiness certification. Cache migration and server credentials/configuration must be available in the deployment; unavailable protection RPCs fail closed. Expired rows may physically remain until opportunistic cleanup, but serving TTL excludes them. Vendor licensing, real payload coverage, and deployment/environment status are outside this review. No deploy, migration, credential, billing or environment change performed by this review.

## UI test log reconciliation
The older paid-ui-tests.log contains4 undefined styles and5 undefined technical SSR harness errors, plus one stale studio-focus markup regex. These are CSS-module fixture adaptation failures, not evidence of provider/data regressions. Updated focused owner/UI checks subsequently passed83 tests. Coordinator owns final whole-suite run.
