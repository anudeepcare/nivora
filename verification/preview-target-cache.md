# Preview target continuity correction

## Live diagnostic
On 2026-11-16 around 00:12 UTC the connected nivora database had one unexpired request-limit row with count 25, expiring 2026-11-16 03:45:38.464199 UTC. The limiter saturates at max+1 and SentiSense is the only 24-call reservation in the inspected source. This strongly supports exhausted daily target allowance; the hashed key could not be independently matched because the sensitive Vercel key is non-readable. No key-expiry denial latch was present. The configured preview trial expires 2026-11-17 02:06:05 UTC.

The successful target cache previously lived only in one server process. A deployment/cold instance discarded that cache while the shared daily allowance remained exhausted. This is a reproducible continuity defect, not evidence of every live ticker failure.

## Change
- Cache only successful normalized targets in the existing private market-cache table, under a dedicated preview/key/ticker namespace.
- Read and write use new service-role-only RPCs. Unrelated provider cache and budgets are not changed.
- Cap expiry at 24 hours or the preview key expiry, whichever is sooner. Validate target freshness, identity and bounds again at read.
- Gate every read on existing owner/preview/key rules. A durable denial blocks a shared read; hosted warm-memory positives must also pass that shared read and cannot bypass it. Production/nonowners never use this feature.
- A local failed result cannot hide a valid observation subsequently obtained by another instance.
- Never persist negative results, credentials, raw profile/consensus payloads or fabricated targets. No stale fallback, allowance increase, automated bulk extraction or new data purchase.

## Deployment requirement
Apply the included `20261116001606_auryn_preview_target_cache.sql` migration before the new code can use shared storage. It was tested locally, not applied to the connected database. Without it, shared-cache read errors fail closed: no optional enrichment or upstream requests. A healthy cache miss still uses the existing guarded fetch path. No production deployment or database change was performed.

This preserves future successful observations. It cannot recover observations already lost from memory, fix missing provider coverage, grant commercial licensing, lift the 24-call daily trial budget, or make a short-history monthly Pace value exist.

## Follow-up review verification
Warm-memory denial regression reproduced before the fix. After the correction, 30 provider/cache/normalization tests pass, including warm shared-denial and unavailable-cache cases; ESLint and TypeScript pass. Guard-specific tests explicitly inject a healthy empty cache to isolate reservation/denial behavior.
