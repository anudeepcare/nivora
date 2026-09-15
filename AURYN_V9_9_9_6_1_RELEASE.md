# AURYN V9.9.9.6.1 — Compile + Extended-Hours Session Hotfix

Two fixes:
1. Vercel compile failure: FastResearchQuote duplicated the DisplayLabel union and did not include ACTIVE_SESSION_PRICE_UNAVAILABLE. It now imports and uses the canonical `DisplayLabel` type directly, preventing this drift.
2. Root-cause session bug: provider `is_market_open=false` was interpreted as CLOSED even during AURYN PRE_MARKET / AFTER_HOURS. AURYN exchange calendar now owns the session. Provider regular-market flags cannot collapse an active extended-hours session to CLOSED.

Expected at 7:59 PM ET:
- AURYN session = AFTER_HOURS regardless of provider regular-market-open=false.
- Fresh after-hours data -> AFTER-HOURS PRICE.
- No fresh after-hours data -> AFTER-HOURS PRICE UNAVAILABLE.
- A stale morning price cannot become the primary headline.

No SQL.
