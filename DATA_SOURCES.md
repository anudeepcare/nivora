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
