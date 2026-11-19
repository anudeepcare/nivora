# Market insider activity

Official source: https://sentisense.ai/docs/api/insider-trading/ (reviewed 2026-11-18).

Screener → Insider activity lazily reads the fixed SentiSense `/api/v1/insider/activity` endpoint with a bounded 30/90-day lookback. No ticker fanout. Existing provider key/token settings apply; no migration.

This is the provider's company-ranked aggregate buying and selling response, not all transactions or exhaustive market coverage. Sell aggregates exclude withholding (F), still include issuer dispositions (D), and cannot be called discretionary sales or a directional recommendation. No net-flow score is computed. Counts/shares/value/latest transaction and insider are shown as reported; malformed, future or out-of-window rows are withheld with a count. Duplicate ticker identity in a direction fails validation. Zero remains zero.

FREE preview is clearly labeled (up to five per direction). Full provider entitlement is not established by this implementation. Route requires signed-in, non-sample deployment and overview/advanced access, bounded rate/usage admission. Fixed host, no redirects, 12-second timeout, streamed 2 MiB limit, whitelisted DTO, neutral errors.

Server in-process cache is 15 minutes, keyed by credential digest and window; client cache is five minutes. The original fetch receipt remains visible. An open loaded view can be older, and no source publication timestamp is supplied. There is no periodic background polling or claim of real-time SEC coverage.

Tests cover DTO direction/zero/preview/redaction, invalid/future/stale rows, duplicate identity, route/source safeguards and UI semantics. No live provider entitlement, deployment, browser rendering or account changes were verified.
