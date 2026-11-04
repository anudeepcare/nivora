# Price trust and shared cost controls

## Activation — required before calling protection live

1. Run `supabase/migrations/20261019140303_shared_market_guard.sql` in the AURYN Supabase SQL Editor, or apply it through your normal migration workflow. It adds server-only cache, budget, user-quota and stream-ownership tables/functions; it does not change holdings or watchlists.
2. In Vercel server environment variables, set `AURYN_SHARED_MARKET_GUARD=true`. Ensure `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are configured. Keep the service-role key secret. Existing EODHD and Twelve Data keys remain in use. Redeploy after changing environment variables.
3. Optional controls: `EODHD_DAILY_BUDGET=8000` and `AURYN_USER_MARKET_REQUESTS_PER_DAY=2000`. The EODHD cap is the smaller of the configured app budget and 80% of the allowance returned by the vendor's zero-cost `/api/user` endpoint. The user quota counts authenticated market API requests, not weighted vendor units. Set `AURYN_REQUIRE_DISTRIBUTED_BUDGET=true` only after confirming the earlier Twelve Data budget migration is installed.

The shared guard is disabled by default in the source so deploying code before its schema cannot silently break the app. When explicitly enabled, missing service configuration/migrations or unverifiable usage blocks new EODHD requests rather than silently bypassing the budget. Fresh shared cached data can still be served without a new provider spend. These changes have not been applied to the live database here.

## What it does

- Uses a canonical, hashed endpoint/parameter/token identity to share EODHD market datasets across users and workers. No user portfolio or provider token is stored in the shared cache. Quotes retain the original provider observation time.
- Atomically grants one 30-second refresh lease per cache key. Followers use the published result or receive a retry message; they do not launch duplicate upstream work. Waiting is bounded to three seconds. Failed refreshes release leases but do not refund potentially spent credits.
- Enforces a shared UTC-day weighted reservation ledger. It reconciles conservatively to the latest observed provider usage, sampled at most every five minutes per worker (plus the platform's fetch cache), and reserves before calling upstream. Endpoint weights are estimates based on documented costs; raw vendor counters remain authoritative. Other applications sharing the same token can consume allowance between observations, so the 20% reserve is a buffer, not a guarantee against every external burst. Extra-call balances are deliberately excluded from the app budget.
- Applies a per-account daily request quota to authenticated market endpoints. Ordinary portfolio edits and settings do not consume this quota. Server-route minute limits remain in place.
- Honors numeric `Retry-After` on HTTP 429 and pauses to the next UTC day on HTTP 402. The pause is shared when the guard is enabled. Cached results remain usable; denied requests do not become fake prices or zero values.
- Grants one database-backed 70-second stream ownership lease per token/worker. With 55-second downstream sessions, the owner expires after its last bounded session. This prevents different workers from independently exhausting the shared streaming subscription allowance. Losing workers use REST fallback.

## Streaming scale limit

A stream ownership lease prevents competing upstream owners; it is not a cross-worker price fan-out service. Users routed to a nonowner worker may receive polling instead of streaming. The existing in-worker hub shares up to 50 subscriptions, and a browser view selects up to 30 symbols. A centrally hosted relay/fan-out remains necessary before promising all users simultaneous live coverage. No external infrastructure or subscriptions have been purchased.

## Price presentation and efficiency

Display-time freshness checks no longer trust a cached `stale:false` flag forever. An old market-open quote becomes stale as its age grows; invalid prices are withheld. Delayed quotes retain their delayed identity; live events have a shorter age allowance. Research marks failed refreshes stale. The research universe shows observation time instead of a date alone.

REST quote polling skips symbols that recently received healthy streaming trades. Quiet, missing and disconnected symbols retain polling. Calculations continue to use completed historical bars where required; incoming ticks do not manufacture completed technical signals or change provider timestamps.

Twelve Data remains the first REST quote/intraday source with its existing shared minute budget when configured; EODHD supplies streaming, financials, history and news. This release does not silently cancel either subscription or switch every quote to a delayed EODHD snapshot.

## Evidence and limitations

`verification/trust-and-budget-verify.log` contains unit/SSR, actual PGlite Postgres migration checks, TypeScript and production build results. `verification/trust-and-budget-api.log` contains compiled-route fixture checks, including enabled shared-cache hits, reservations, budget denial, user quota and stream ownership rejection. SQL tests verify service-role access and anonymous denial, cache lease/publish ownership, cached reads while paused, weighted limits and stream exclusivity.

Live Supabase migration, actual account quota/entitlements, deployed streaming and physical iPhone behavior have not been verified in this environment. The application is not asserted ready for unrestricted commercial traffic.
