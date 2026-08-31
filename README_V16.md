# NIVORA V16 — Shared Live Scale

Focus: near-live data with fewer upstream API calls.

Changes:
- Shared Vercel/Next cache by symbol/provider.
- 45s core market-data TTL and 30s visible-page refresh.
- 2-minute Finnhub news refresh/cache.
- 5-minute SEC filing/submission refresh.
- 6-hour fundamentals/earnings caches.
- Shared market + watchlist scan caches.
- Freshness indicator in the stock UI.
- Browser uses cached Supabase session for common reads where possible.
- Existing mobile V15 polish retained.

Optional SQL: `supabase/v16_scale.sql`.
No new API account is required.
