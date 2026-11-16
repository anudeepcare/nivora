# Independent source review: optional preview target cache

Reviewed provider, normalization, access-policy, SQL migration and cache tests. Migration has not been applied by this review; no deployment or live provider request performed.

## Verified structure
- Hosted cache RPCs are SECURITY INVOKER with empty search_path, schema-qualified table references, revoked PUBLIC/anon/authenticated execution and service_role-only grants. Private table RLS/grants are supplied by existing market-cache migration.
- Read/write namespaces include API-key SHA-256 identity and symbol. Only normalized analyst observations are persisted; JSON allowlist excludes extra credential/private payload fields. Stored key hash is not a raw API key.
- Transport remains fixed-host, no redirects/no framework cache, with per-request reservation and durable denial guard. Cache reuse does not consume additional upstream requests.
- Caller must be owner, explicitly enabled preview/local test, non-production, with a currently valid key expiry no more than three days away. Nonowner projection strips optional targets independently.
- Cache is shared among trusted owner requests using the same provider key, not keyed to application user ID. The payload is a market observation, not portfolio/account content. This does not itself establish contractual redistribution rights; it remains owner preview, not commercial production authorization.
- App normalizer requires matching ticker/listing, USD, allowed exchange, real finite positive ordered low/mean/high, valid count, strict dataset timestamp, no more than seven days old. Missing target bands remain missing, not fabricated. Refresh timestamp remains dataset-refresh, not analyst-publication date.
- Persisted serving lifetime is at most 24 hours and capped by configured key expiry on write/read. Every consumption revalidates freshness and current preview gates. SQL alone cannot know configured key expiry; trusted application enforces that boundary.

## Retention is not TTL serving
SQL queries exclude expired rows. Read/write opportunistically delete expired namespace rows. There is no dedicated scheduled deletion in this migration: an expired row may physically remain until another relevant read/write or existing general cache cleanup. Do not promise automatic physical deletion exactly at 24 hours or at key expiry.

## Corrected finding: shared denial and availability
Independent reread confirms cache-enabled and hosted-preview warm positives no longer return from memory directly. They require the shared read. A null/denied shared read cannot fall back to a still-live memory value. A shared read RPC error now throws and is caught as a null result before transport, so missing migration or unavailable protection infrastructure fails closed rather than triggering new upstream calls. Local explicitly enabled development without shared cache retains its separate local safeguards.

## Remaining deployment conditions
- The migration is not applied by this review. Hosted preview enrichment requires the read RPC and existing rate-limit/denial infrastructure to be available. Without it optional targets stay absent; existing research remains intact.
- Successful live observations may still be returned if cache *write* fails after the guarded fetch. They are not represented as durably cached; later cache-enabled reads still require shared validation.
- Physical retention and commercial-licensing limits above remain unchanged. This is owner-preview functionality, not a production data license or guaranteed target coverage.

## Tests observed
The independent final run passed 30/30 provider, cache migration and target normalization tests, including warm shared-denial/unavailable-cache regression. SQL tests execute permissions and expiry in PGlite; they do not establish that the hosted migration is installed. No live provider call, database application, or deployment was made.
