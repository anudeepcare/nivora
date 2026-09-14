# AURYN V9.9.8 — Market Price Authority

## Root cause
The visible market price was not a single market-price concept. Alpaca execution normalization could prefer a newer bid/ask midpoint over the latest executed trade. On wide or transient books, that midpoint can move several dollars even when the last traded market price has not. The page also retained canonical research truth as a display fallback during active sessions.

## New market-price contract
AURYN now has one session-aware display-price authority:
- REGULAR -> LIVE MARKET PRICE
- PRE_MARKET -> PRE-MARKET PRICE
- AFTER_HOURS -> AFTER-HOURS PRICE
- OVERNIGHT/CLOSED -> LAST OFFICIAL CLOSE
- disputed/unavailable live session -> PRICE VERIFYING

The authority validates symbol, timestamp, session, freshness and provider agreement. It never chooses a provider because it answered first.

## Provider behavior
- Alpaca display market price uses latest executed trade first.
- Alpaca execution quote semantics remain unchanged and may use current bid/ask quote information for execution safety.
- Alpaca market-data calls remain pinned to IEX.
- Regular-session candidates older than 60 seconds are rejected.
- Two fresh providers differing by more than 1.5% are treated as CONTESTED -> PRICE VERIFYING.
- If providers agree, the newest provider timestamp wins.

## UI behavior
During active sessions, canonical research price is never substituted for a missing live display price. The last accepted live authority is retained during the existing short grace window; after that, AURYN says PRICE VERIFYING rather than showing a contradictory number.

## Unchanged
- CIO formulas, weights, thresholds and action logic.
- Canonical execution verification.
- V9.9.7 autonomous market-cycle workflows.
- Supabase schema.
- `vercel.json = {}`.

No SQL or Supabase migration is required.
