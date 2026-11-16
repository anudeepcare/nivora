# Explicit SentiSense Pro target mode

## Configuration and integration
- `AURYN_SENTISENSE_MODE=pro` explicitly selects paid behavior, in hosted preview or production only. Do not set this flag until code and included private target-cache migration are deployed together. This work has NOT set the flag or deployed anything.
- The key is already saved as a write-only Vercel secret for Preview/preprod and Production. It is not in the code or artifact.
- Paid mode requires `authenticated: true` supplied by the server after the app's existing account, beta/subscription and reservation checks. It does not grant account access, change those rules, or require owner identity.
- With no mode configured, the prior owner-only temporary preview path remains unchanged. Unknown modes fail closed.
- Paid mode ignores old `SENTISENSE_KEY_EXPIRES_AT` and `AURYN_SENTISENSE_PREVIEW_ENABLED`; do not extend the old trial expiry to simulate Pro.

## Guardrails
- Pro uses a separate key-derived identity from trial, including cache, pending work, shared limiter and denial latch. No old owner-trial values can be served via paid cache.
- Existing private service-role cache RPC migration remains required; missing RPC fails closed. No migration was applied during this implementation.
- Successful normalized targets expire in one hour, with source freshness and identity revalidated. No stale/fabricated ranges or invalid observations are cached.
- Shared request allowance is 240 requests/minute, conservatively under the documented Pro 300/minute; one reservation per outbound request and 250ms queue spacing and a DB-supported 4 requests/1000ms burst window. No trial 24/day limit in Pro mode. Capacity is bounded to 256 pending symbols per key per process. The dedicated authenticated `/api/analyst-targets/[symbol]` endpoint uses a 20-second end-to-end provider budget and loads independently of base research and charts. Base research does not start paid target work. Generic internal client calls retain a 3-second default budget: queued work checks cancellation before network, and started fetches use an abort signal. It does not fire a later consensus request after the deadline.
- 401/403/429 and uncertain transport leave a shared 15-minute protection latch; longer Retry-After on 429 extends that latch. No automatic retry loop. Ordinary unsuccessful observations cool down 5 minutes.
- Target calculation uses existing profile + consensus endpoint normalization and preserves primary quote/evidence data.
- Estimates normalizer is contract-tested but NOT fetched/merged: official estimates schema does not supply an observation timestamp, and this release must not pretend estimates refresh the dated financial snapshot.

## Verification scope
Review corrections verified: deployed SQL rejects 250ms windows; 4/1000 contract passes PGlite, inherited trial targets are stripped before unsupported-asset return, and optional timeout aborts actual transport.33 provider/cache tests, ESLint and TypeScript pass after these changes.

Provider tests exercise authenticated paid preview/production, expired trial config, isolated trial cache, finite cache TTL, shared denial across cold clients and Retry-After extension. API compiled-handler fixture covers both rollout environments and keeps the existing authorization path.

Pro account and generated key were observed active in the vendor console. Real paid endpoint payloads have NOT been fetched by this code: production/preprod code deployment was not authorized in this task. Synthetic fixtures are not live coverage verification or DCA parity proof.
