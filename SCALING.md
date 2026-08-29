# NIVORA V16 scaling model

## Shared market brain
V16 uses Next/Vercel shared server caching per provider + symbol so 20 users looking at IREN do not create 20 identical provider calls.

Freshness targets:
- Core price/decision: upstream cache ~45s, browser refresh ~30s while visible.
- Broad market: ~60s.
- Watchlist scanner: ~120s.
- Finnhub company news: ~120s.
- SEC submissions/catalysts: ~5m.
- Earnings calendar/surprises: ~6h.
- SEC fundamentals: ~6h.
- Company/search metadata: ~24h.

All technical indicators and NIVORA decisions are computed in our server from cached OHLCV; we do not buy separate indicator calls.

## Scale path
20–100 users: current Vercel cache + Supabase user data.
100–1,000 users: add server-only shared snapshot persistence / queue and hot-symbol warming.
1,000+ users: add dedicated Redis/queue + licensed consolidated market data if needed.

Never put provider secrets in browser code.
