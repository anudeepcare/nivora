# NIVORA data-source plan

## Already used
- Twelve Data: OHLCV, stock/ETF/crypto search and market data.
- SEC EDGAR: filings and XBRL company facts. No API key required.
- Supabase: authentication, watchlist, alerts and portfolio state.

## Recommended now
- Finnhub free developer account: company news, upcoming earnings calendar, recent earnings surprises and company profile/recommendation endpoints where available.

## Later, only if needed
- Massive (formerly Polygon): consider when NIVORA needs full-US-market consolidated coverage, faster market-wide scanning or institutional-quality real-time stock data.
- A premium estimates/fundamentals provider: only after the V12 forward-estimate/valuation gap is clearly defined. Avoid paying for overlapping feeds before then.

NIVORA keeps providers behind server routes so a provider can be changed without redesigning the UI.

## Options / Gamma — MarketData.app
Server-side only via `MARKETDATA_TOKEN`. V22 fetches a standard option chain lazily when the Options tab is opened, caches it for six hours, and derives OI/gamma positioning proxies. Free/trial data is at least 24 hours delayed.

## V9.2 historical research backfill
- **Twelve Data `time_series`**: adjusted daily OHLCV. V9.2 requests explicit `start_date`, `end_date`, `interval=1day`, and `adjust=all`; provider payloads are normalized before V9.1 sees them.
- **SEC `data.sec.gov/api/xbrl/companyfacts`**: historical financial-statement facts. AURYN uses the SEC filing date (`filed`) as the point-in-time availability boundary and keeps the economic period end separate.
- **Historical universe / delistings**: must be supplied explicitly. Current-constituent lists are not treated as survivorship-safe history.
- **Optional research families** (earnings revisions, macro vintages, options, news/catalysts): remain missing until a provider can supply verifiable historical availability timestamps.
