# Quarterly convertible bonds and options

Official contract: https://sentisense.ai/docs/api/institutional-flows/

The existing institutions section has a closed-by-default, selected-only panel for market-wide convertible bonds and call/put positions. This is not per-manager holdings, a live flow tape, contract pricing, or a directional recommendation.

The server first retrieves `/institutional/quarters`, selecting the newest returned valid past quarter with `pending: false`; it never constructs a reporting quarter from today's date. It then requests only `/institutional/bonds?reportDate=...` or `/institutional/options?reportDate=...`. The provider array does not echo the reporting date, so the UI explicitly identifies the date as the validated request date, not independently verified row provenance. Any supplied row date must agree.

Neither dataset documents upstream pagination. The UI therefore pages the bounded returned array locally, 25 rows at a time, without sending undocumented limits/offsets. Responses above 5,000 rows or 2 MB fail closed. Preview responses must contain at most three rows. Duplicate/malformed identities are omitted and counted. Missing or invalid numeric values remain unavailable; zero is retained. Position values are labeled reported USD exposure, share/unit changes are not contract counts or cash flows, and proprietary directional inferences are not invented.

Account authentication, advanced-feature access, sample-deployment rejection, user/provider quotas, fixed upstream host/path, no redirects, and a 12-second timeout per request apply. The two sequential requests can take up to approximately 24 seconds. Client reuse is five minutes; source/retrieval limitations remain visible. No new credentials or database migrations.

Tests exercise actual private route, fixed upstream requests, projection, and rendered markup, plus quarter eligibility, identity, preview, numeric and response-size guards. Live upstream entitlement, deployed behavior, and browser layout are not verified.
