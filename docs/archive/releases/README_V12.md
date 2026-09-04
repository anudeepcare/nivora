# NIVORA V12 — Daily Investor OS

V12 keeps the visual language from V11 but upgrades the product brain and everyday workflow.

## What changed
- Today dashboard with broad-market regime and ranked watchlist attention.
- Action-first stock screen for Now / Swing / Long term / I own it.
- Better Entry, Confirmation, and Protect/Reassess prices remain the primary plan.
- Quick Read: Business, Trend, Momentum, Entry, Risk, Catalyst.
- Plain-English positives and risks before raw indicators.
- “What changed today?” section using price/volume plus connected material news.
- Market context and relative strength versus SPY (BTC benchmark for alt crypto).
- Stronger technical engine: EMA structure, RSI, MACD, OBV/flow, relative strength, ATR/volatility, extension, support/resistance and market regime.
- SEC fundamentals upgraded to support US GAAP and IFRS facts where available.
- SEC filing classification: financial reports, material events, insider filings, and financing/dilution watch.
- Optional Finnhub integration: live North American company news, upcoming earnings, recent earnings surprises, recommendations/profile when the endpoint is available.
- Watchlist ranking.
- Portfolio tracking with current-price snapshots and unrealized return.
- Mobile bottom navigation: Today / Analyze / Watchlist / Portfolio.
- Raw technical numbers moved behind the Technical tab.

## Required setup
Use the same Supabase project and Twelve Data key.

Create `.env.local`:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
TWELVE_DATA_API_KEY=...
FINNHUB_API_KEY=...

`FINNHUB_API_KEY` is optional, but recommended for the full news/earnings experience.

## Supabase
Run once:

`supabase/v12_upgrade.sql`

This adds the private `portfolio_positions` table with RLS. Existing V11 tables are preserved.

## Run
npm install
npm run dev

## Verification
The source passes TypeScript `tsc --noEmit` in the build workspace. A full Next production build was not completed because the clean workspace dependency installation timed out; do not treat that as a code failure.

## Product principle
The first view should answer:
1. What should I do?
2. Why?
3. Where is the better entry?
4. What confirms strength?
5. Where should I reassess?
6. What changed today?
7. What catalyst is next?

Everything else is supporting evidence.
