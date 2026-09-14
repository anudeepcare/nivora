# AURYN V9.9.8.1 — Market Data Reliability

Root cause found in the deployed price pipeline:
1. The display path used the timestamp of the latest executed Alpaca trade. Less-active stocks/ETFs could have a perfectly fresh bid/ask but an executed trade older than the 60-second display cutoff, so AURYN rejected them while mega-caps kept working.
2. Crypto pairs were excluded from Alpaca but still passed through equity market-session logic. BTC/USD and ETH/USD therefore had no true 24x7 authority state.
3. Provider failures were collapsed into a generic 'No fresh market-data provider' error, hiding rate-limit/coverage information.
4. The Research page polled every 4 seconds, which was unnecessarily aggressive.

Fix:
- Explicit CRYPTO_24X7 market authority.
- Equities/ETFs accept a sane fresh quote midpoint as display market context when a recent trade is unavailable. It is labeled internally as QUOTE_MID and is never promoted to execution verification.
- Executed trades remain preferred for cross-provider agreement.
- One healthy provider may display with SINGLE_SOURCE confidence.
- Two fresh executed-trade providers disagreeing >1.5% still fail closed.
- Regular trade acceptance widened from brittle 60s to 180s; fresh quote candidate must be <=90s.
- Crypto Twelve Data candidate allowed <=300s and bypasses equity sessions.
- Provider timeout increased from 1.3s to 3.5s.
- `/api/quote` failure payload now returns diagnostics: OK/RATE_LIMIT/TIMEOUT/UNAVAILABLE/STALE/ERROR.
- Visible Research polling reduced from 4s to 12s and remains paused while the tab is hidden.

No API plan upgrade is assumed. Diagnostics should be used after deployment to determine whether a provider tier is actually limiting coverage.

No SQL or Supabase migration required.
V9.9.9.2 Portfolio UX and consolidated holding behavior preserved.
