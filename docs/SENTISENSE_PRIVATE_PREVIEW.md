# SentiSense private target preview

This optional adapter is disabled by default. It supplements analyst targets only for the authenticated owner. It does not replace prices, history, fundamentals, recommendations, scoring or Pace. It is not enabled for paying customers or production.

## Configuration

Use server-only environment variables; never use a `NEXT_PUBLIC_` credential variable or commit a key.

- `AURYN_SENTISENSE_PREVIEW_ENABLED=true`
- `SENTISENSE_API_KEY`: the authorized temporary key.
- `SENTISENSE_KEY_EXPIRES_AT`: the actual key cutoff as a UTC ISO timestamp, for example `YYYY-MM-DDTHH:mm:ssZ`. It must be future-dated and no more than 72 hours away. Do not extend this to outlive the issued key.
- Hosted preview: `VERCEL_ENV=preview` and the normal compiled `NODE_ENV=production`. If a hosted preview is running another Node mode, `AURYN_SHARED_RATE_LIMIT=true` is required.
- Explicit local development only: omit `VERCEL_ENV`, set `NODE_ENV=development` and `AURYN_SENTISENSE_LOCAL_PREVIEW=true` as well as the main enable flag.

`VERCEL_ENV=production` is always rejected. `NODE_ENV=production` without a preview environment is also rejected. The access server must verify `access.owner`; an ordinary Pro account is not enough. Missing, expired or invalid configuration yields the original research response without a request to SentiSense.

## Existing database prerequisites

Hosted previews need the existing account service configuration and service-role-only `public.auryn_request_limits` table plus `auryn_request_allow` RPC from `20261107140000_auryn_shared_request_limits.sql`. This change adds no migration and applies none. Missing database configuration, permissions or guard availability fails closed while EOD-backed research remains available.

Every upstream request reserves both a per-key 1-request/7,100-ms allowance and a 24-request/86,400,000-ms allowance using the existing shared limiter. A cold profile plus consensus costs two requests. In-process requests are serialized at least 7,200 ms apart, identical requests coalesce, and profile/target results are cached for 24 hours per key and symbol. Cache and coalescing are process-local; the budget and denial latch are shared in hosted previews. The conservative fixed-window cap is at most 768 requests over any 31-day interval. Explicit local development uses process memory instead of a distributed database guard.

Before each upstream call, the hosted client atomically inserts a separately namespaced hashed latch into the same service-role-only table. The positive `count` is a random lease nonce. An active latch cannot be overwritten. A known non-denial response releases only that operation's key-and-nonce pair. HTTP 401, 403 or 429, uncertain transport outcomes and process interruption retain the latch through the temporary key cutoff. There are no automatic retries after these outcomes, including after a cold start or the next daily budget window. A failed guard claim makes no provider request. No credentials or provider response bodies enter the latch, research issues or logs.

## Data contract and fallback

The fixed origin is `https://app.sentisense.ai`. Requests use `X-SentiSense-API-Key`, forbid redirects, disable framework caching and time out at 15 seconds. There is no configurable origin override.

The pure `normalizeSentiSenseTargets(consensus, profile, symbol, now)` function accepts the observed raw or `{data: ...}` wrapper forms. Both returned tickers must match the requested symbol exactly, including the share class. Listing currency comes from the matching profile's explicit USD currency and supported US exchange MIC. An explicit target currency must agree. No currency conversion or symbol/share-class substitution is inferred.

The whole low/mean/high band must be finite, positive and ordered. Missing analyst count stays null; any supplied count must be a positive integer. Preview recommendation zeros and provider current price/upside fields are ignored. Refresh time must be a real UTC ISO calendar timestamp, agree with an epoch when supplied, be no more than 60 seconds ahead, and no older than seven days. This is a dataset refresh, not an individual target revision date or forecast horizon.

Targets live in `Research.analystTargets`, separate from EOD financial evidence. A valid complete band is selected atomically; otherwise the existing EOD consensus remains the fallback. Comparisons use AURYN's existing settled close. Ratings and estimates retain their EOD source and date. UI captions show selected target provenance, and local visit comparison stores and retains the target with its own source/date. Switching providers is not described as a target revision.

## Verification boundary

Automated tests inject only transport, time, budget/storage boundaries. The hosted latch adapter is additionally exercised against an isolated PGlite database with the existing migration, including concurrent fresh clients and denial persistence. This is not a test against a live deployment or live database. Any live provider checks and licensing review are recorded separately in the release report. Do not enable this adapter for production or customer redistribution on the basis of a temporary preview key.
