# Market earnings calendar

Official contract: https://sentisense.ai/docs/api/calendar/ (checked November 18, 2026).

The lazy market workspace view requests the earnings calendar once per selected 7/14/30-day window, using an explicit America/New_York date boundary. This is the provider's curated US equity coverage, not all worldwide listings. FREE keys may return a first-week preview; PRO coverage is still limited to the provider snapshot. No access tier is inferred from successful authentication.

Requires existing SENTISENSE_API_KEY or SENTISENSE_API_TOKEN; no migration. The route requires account, non-sample deployment, overview and analyst entitlements before provider work. It enforces user/provider rate limits and usage allowance. Fixed HTTPS destination, redirects rejected, 12-second timeout and 2 MiB streamed response cap. Errors omit raw provider bodies/credentials. Private responses are not publicly cached.

A credential-hashed, 12-entry process cache retains successful normalized responses for 24 hours and preserves their receipt timestamp. It is not a distributed cache. Snapshot build time is separate and unknown/future values are withheld. Browser resource cache is five minutes and keyed by the current Eastern day; the view checks the local clock once a minute and on window focus to roll to a fresh day. A loaded view can outlive server cache expiry; no background fanout to ticker research. Schedule changes may occur between refreshes.

Confirmation and session timing are preserved, never inferred. Weekend events remain valid. Calls keep explicit offsets and may follow the report date. Only confirmed rows expose valid offset timestamps and HTTPS webcast URLs. Numeric estimates have no assumed currency symbol; provider normalization/accounting basis can differ from filings. Rows already carrying results are excluded from the upcoming view. Empty results are not evidence that nothing is scheduled.

Validation uses synthetic contracts and mocked transport/access. Live provider entitlement, DB quota and rendered browser flow have not been verified.
