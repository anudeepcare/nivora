# Daily holdings/watchlist radar

## Deployment requirement
Apply `supabase/migrations/202611180001_daily_radar.sql` using the normal reviewed database migration process. This change has **not** applied the migration or called live market providers. The authenticated API requires the existing Supabase server credentials and configured EOD market-data integration. Missing storage produces an explicit unavailable message; it does not present a complete radar.

## Operation
- Server derives symbols from the authenticated user's saved positions and watchlist. Request parameters cannot add another user's symbols.
- Cache identity is user ID + UTC day + symbol. Changed holdings/watchlist are read on every continuation. Removed symbols are excluded; new symbols are queued. Authenticated users can only SELECT their own cache; service role alone can write/claim leases.
- GET returns saved progress, paging at most 20 completed histories. POST advances at most two instruments, sequentially, and returns only changed histories. The client merges actual observations and displays shown, ready, pending and excluded counts.
- Calls use the existing split-aware six-month daily-history adapter and shared provider cache/quota. No quote, fundamentals, analyst or full-research endpoint is requested, and no monthly company-research reservation is consumed. Advancing batches obey the existing daily market-user guard; cache-only GET does not consume that guard. Sample-only deployments and accounts lacking overview access are rejected before cache/provider work. Ready rows are not fetched again that UTC day.
- Provider outages/rate limits pause continuation, with at most three failed attempts per instrument/day. A durable 90-second lease avoids concurrent writes; publication must match the lease and user.
- The browser continues in small batches while Today is open, refreshes at the next UTC day while still open, and resumes saved work on another visit. **This is not an unattended scheduled worker when the browser is closed.** Closing the page aborts the client request/queue; a server step already executing may finish its bounded cache write.
- Up to 1,000 unique supported held/watched instruments. Oversize accounts fail explicitly rather than treating a truncated universe as the complete account. Crypto and unsupported exchange-qualified symbols are counted as excluded. Missing/short/stale histories retain the existing radar eligibility checks.
- Daily cache age is not the observation date. The chart exposes the actual completed checkpoint; no same-day intraday value is inferred. Name/sector enrichment uses already-loaded full company research only; otherwise symbol/Unclassified is shown.
- Opportunity/Pace business metrics still require genuine full company research. History-only refresh does not invent financials, company scores, classifications or business decisions.

## Validation boundary
Mocked route tests cover user scoping, union/deduplication, no provider calls on GET, bounded continuation, completed-row reuse, cooldown, paging and schema/lease guards. Existing market-radar arithmetic tests remain in place. A real migrated database, multi-session browser race and provider quota smoke test remain necessary before claiming live daily refresh verified.
