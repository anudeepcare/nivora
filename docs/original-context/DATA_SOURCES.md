# AURYN data-source plan

## Existing production/research providers
- Twelve Data: OHLCV, stock/ETF/crypto search and market data.
- SEC EDGAR: filings and XBRL company facts. No API key required, but automated access requires an identifiable User-Agent.
- Supabase: authentication, watchlist, alerts and portfolio state.

## V9.2 historical research backfill
- **Twelve Data `time_series`**: adjusted daily OHLCV. V9.2 requests explicit `start_date`, `end_date`, `interval=1day`, and `adjust=all`.
- **Twelve Data `splits` + `dividends`**: retained as independent corporate-action evidence. Corporate-action fetch is opt-in because these endpoints consume additional provider credits.
- **Twelve Data `earnings`**: complete company earnings history, normalized by earnings-release date. V9.2 derives a point-in-time `surprise_streak` without seeing future releases. Earnings fetch is opt-in.
- **SEC `data.sec.gov/api/xbrl/companyfacts`**: historical financial-statement facts. AURYN uses the SEC filing date (`filed`) as `availableAt`; economic period end is separate.
- **Revision / sector research**: accepted only through explicit point-in-time rows with a verified `availableAt`. A current snapshot is not backdated into history.
- **FRED/ALFRED macro vintages**: normalized with `realtime_start` as `availableAt`, so later revisions cannot leak into earlier replays.
- **Historical universe / delistings**: must be supplied explicitly. Current-constituent lists are not treated as survivorship-safe history.

## V9.2 strict family gate
Before V9.3, the real replay bundle must prove coverage for:
`FUNDAMENTALS,EARNINGS,REVISION,SECTOR,MACRO,CORPORATE_ACTIONS`.

Missing families stay missing and block the release gate. No provider snapshot is treated as point-in-time history unless its historical availability can be verified.

## Options / Gamma — MarketData.app
Server-side only via `MARKETDATA_TOKEN`. The existing Options surface fetches an option chain lazily and derives OI/gamma positioning proxies. Options are outside the V9.2 canonical historical-family gate unless a separately verified point-in-time options history is added later.
