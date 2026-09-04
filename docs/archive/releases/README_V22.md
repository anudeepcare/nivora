# NIVORA V22 — Consolidated Intelligence

Includes:
- V21 mobile/desktop popover + catalyst fixes.
- Decision-first beginner UX.
- Shared caching and multi-user efficiency.
- 6M / YTD / 1Y performance from server-side market history.
- 52-week range position.
- Fundamentals, 5-year record, news, earnings, catalysts, technical evidence.
- Lazy Options Intelligence powered by MarketData.app.
- Call wall, put wall, OI-weighted gamma node, ATM IV, expected move, put/call OI, top gamma-concentration strikes.
- Options requests happen only when the Options tab is opened and are shared-cached for 6 hours.
- About / Terms / Privacy / Disclaimer with in-app navigation.
- NIVORA Intelligence brand footer.

## Required environment variable for Options
Add to Vercel and local `.env.local`:
MARKETDATA_TOKEN=<your MarketData.app token>

Do not commit the token to GitHub.

Free/trial MarketData.app options are at least 24 hours delayed, so NIVORA labels that module accordingly. The core stock decision continues to use the fresher market feed.

## Vercel
Add `MARKETDATA_TOKEN` as a server-side Secret/Environment Variable. Do not prefix it with NEXT_PUBLIC_.
