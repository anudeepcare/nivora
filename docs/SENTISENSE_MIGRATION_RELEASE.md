# SentiSense research migration: release evidence and rollout

## Source selection

This package does not change a deployment or cancel a subscription. Select the new adapter with `AURYN_MARKET_PROVIDER=sentisense`, existing `SENTISENSE_API_KEY`, and `AURYN_SENTISENSE_MODE=pro`. The latest requested price configuration is `AURYN_PRICE_PROVIDER=eodhd` with the existing server-only `EODHD_API_KEY` (or `EODHD_API_TOKEN`).

In this mode, SentiSense provides research, chart history, profile, financial statements, estimates, news discovery, insiders, congressional disclosures, earnings calendar, and options aggregates. EODHD is restricted to HTTP quote reads and the existing WebSocket quote stream. All Twelve Data calls and EODHD research/history calls are disabled. Missing SentiSense data does not silently fall through to legacy research vendors. Legacy adapters remain in the archive for reversible rollout but are unreachable under this selection.

EODHD quote timestamps and stale/session logic are retained. HTTP /real-time responses remain labeled delayed/indicative; only fresh observed WebSocket ticks are realtime. A failed or stale quote can fall back to explicitly identified SentiSense delayed data. SentiSense quotes are 15-minute delayed, not live; API response time is not a price observation timestamp. A newer timestamp is preferred only when it is a real source price timestamp. The existing EODHD WebSocket endpoint is enabled only by the explicit EODHD price selection; polling remains a delayed fallback.

## Must verify before enabling for testers

- Test actual account responses and entitlements. The migration adapter tests use documented fixtures, not authenticated paid production payloads.
- EODHD WebSocket documentation covers US pre/regular/post sessions4am–8pm ET, with50 concurrent symbol subscriptions per token. Actual account access, feed latency and external-display rights remain unverified. HTTP quote access does not establish realtime WebSocket entitlement.
- Confirm SentiSense commercial/external-display permission separately from API accessibility.
- Visually check every route on desktop/mobile, light/dark and installed PWA. Unit/SSR tests are not visual acceptance.
- Check AAPL, APP, IREN, NBIS and broader supported universe under current API data; a universal 1,000-stock comparison has not been performed.

## Material differences, not fabricated replacements

SentiSense documents 1Y daily chart history, 5Y weekly and longer monthly histories. The unchanged AURYN Pace method requires 12 exact completed prior month-end daily closes. One rolling year is not generally sufficient for that complete window. Daily research explicitly uses 1Y and does not manufacture daily bars from weekly/monthly samples. Thus identical Pace coverage is NOT guaranteed. Longer chart ranges retain source granularity and split/dividend adjustment metadata rather than being presented as daily split-only series.

Options aggregate data is not an options contract chain or trade tape. The UI presents aggregate-only coverage through the dedicated summary endpoint, never synthetic contracts. News publisher/document links are not original article headlines or article bodies. Financial rows without a verifiable period/currency or actual/estimate classification are not promoted to financial facts. Unsupported endpoints fail explicitly rather than inventing data or labeling missing observations as zero.

## Safety and retained behavior

Authentication, existing accounts, portfolios, positions, settings, alert storage, and permissions are retained. API credentials remain server-only, are sent to the verified vendor in the vendor's prescribed authentication location, and are excluded from the deliverable. SentiSense transport coalesces identical reads, reserves the shared rate budget, spaces bursts, observes throttle pauses, evicts failed responses and does not follow credential-bearing redirects. Production deployment and subscription cancellation are not part of this package.

Additional visual/source coverage: SentiSense logo-host responses have not been observed through the paid account, so existing restricted image-host policy remains in force with monogram fallback. Do not loosen image URLs to arbitrary hosts to make branding appear complete. Crypto is outside this SentiSense US-equity adapter. Preserve saved positions, but do not imply migrated coverage for those instruments.
