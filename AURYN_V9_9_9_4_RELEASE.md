# AURYN V9.9.9.4 — Session-Safe Market Price + Portfolio Visual Intelligence

## Root cause corrected
The prior authority used regular-market freshness thresholds inside Alpaca regardless of session and discarded older provider prices before the authority could make a safe fallback decision. Twelve Data also discarded prices older than 15 minutes. During after-hours this caused widespread PRICE VERIFYING even when a real timestamped last market price existed.

## New price state machine
- REGULAR: fresh trade first, fresh sane quote fallback, otherwise VERIFYING rather than pretending stale data is live.
- PRE_MARKET / AFTER_HOURS: fresh session price when available.
- If no fresh extended-hours trade exists, display the newest real timestamped provider price as LAST MARKET PRICE. It is explicitly RECENT/SINGLE_SOURCE, never labeled LIVE or AFTER-HOURS.
- CLOSED / provider-reported closed: preserve truthful last-market/official-close behavior.
- CRYPTO_24X7: Coinbase + Twelve fallback from V9.9.9.3 preserved.
- Provider `is_market_open` is used when supplied instead of blindly imposing the U.S. session on that response.
- No canonical/research decision price is substituted into the header.

## Portfolio visual improvements
- Portfolio series is materially thicker than benchmarks.
- SPY is blue; QQQ is gold and dashed; Portfolio is green with area emphasis.
- Legends visually show the different line weights/colors.
- Added an Insight Ribbon with Top Contributor, Biggest Drag, Cash Buffer, Concentration and a Risk Capacity gauge.
- Existing clickable Drivers, Matrix, sortable Holdings and compact Add Investment remain.

No SQL or Supabase migration.
CIO formulas and autonomous workflows unchanged.
