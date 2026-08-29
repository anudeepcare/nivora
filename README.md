# NIVORA V4 Investor

Beginner-first investor UX with deep analysis underneath.

## Major V4 changes
- Search accepts company names, tickers and common crypto names.
- Fast local aliases for common stocks/crypto before provider fallback.
- Bitcoin/BTC -> BTC/USD, Ethereum/ETH -> ETH/USD, Solana/SOL -> SOL/USD.
- Every asset answers Long-term / Swing / Buying Today separately.
- Plain-English explanations for Quality, Trend, Entry and Risk.
- Preferred plan compares pullback vs buying now vs breakout confirmation.
- Breakout logic explicitly avoids treating the first tick over resistance as automatic confirmation.
- Real candlestick + volume chart and mapped levels.
- SEC fundamentals + filings/catalysts for US-listed companies.
- Optional Finnhub news.
- Watchlist, alerts, profile and authentication retained.

## Setup
1. Run `supabase/schema.sql` in a fresh Supabase project, or `supabase/v4_upgrade.sql` if V3 schema is already installed.
2. `.env.local` already contains the Supabase URL + publishable key previously supplied.
3. Add your current Twelve Data API key:
   TWELVE_DATA_API_KEY=...
4. Optional news:
   FINNHUB_API_KEY=...
5. `npm install`
6. `npm run dev`

## Product rule
NIVORA is decision support, not a guaranteed-return engine. Scores need historical and forward validation before being treated as a proven edge.
