# Provider allocation — current implementation

The user already subscribes to Twelve Data and EODHD All-in-One. This build uses both without requesting an additional subscription. Personal use comes first; commercial rights and scaling remain a later acceptance gate.

| Dataset | Preferred source | Behavior / cache |
|---|---|---|
| Quotes, including USD crypto | Twelve Data | 60 seconds; timestamp from provider; EODHD fallback on failure, labelled delayed/indicative |
| 1D / 1W charts | Twelve Data | 5-minute / hourly bars; 60 seconds; EODHD historical intraday fallback |
| Longer daily charts and technical/DCA inputs | EODHD | 15 minutes; split-adjusted OHLC, already adjusted volume preserved; Twelve Data whole-series fallback |
| Search and instrument identity | EODHD when configured | 1 hour; US/USD listings and USD crypto; exact crypto shortcuts; Twelve path when EODHD absent |
| Annual/quarterly financials, derived TTM | EODHD | 6 hours; 19 mapped raw financial fields and 31 financial metrics in the catalog; coverage varies |
| Consensus, estimates, ownership, earnings, insiders | EODHD fundamentals | Reuse the same fundamentals response; no separate request for each displayed metric |
| Company profile and logos | EODHD, then available Twelve/Finnhub logo sources | 1 day; bundled logos first in the UI; fixed neutral fallback |
| News | EODHD | 1 hour; on Thesis visit; dated publisher links, no unsafe/future URLs |
| Filings | EODHD SEC endpoints | 6 hours; on Thesis visit; 10-K/10-Q/8-K with validated SEC source URLs; foreign-form coverage is limited |
| Dividends / splits | EODHD | 1 day; displayed on Thesis; holdings are not automatically adjusted |
| AI evidence interpretation | Separately configured AI service | Default off; EODHD does not include AI generation credits |
| Execution | Alpaca Paper | Separate trusted-admin safeguards; default off; no live-money integration |

When EODHD is not configured, the existing Twelve Data/SEC/Finnhub path remains available. No automatic financial-provider merge occurs. Market fallbacks replace a complete quote/series and identify the selected source; prices are not compared opportunistically to choose the most attractive value. Daily charts are split adjusted, not dividend-reinvested total returns.

## Data quality and cost boundaries

Provider keys remain server-only. Failed requests are not cached as valid data. Concurrent identical requests share promises; successful datasets are cached by instrument/endpoint and bounded in process memory. Twelve Data keeps the existing credit guard and optional distributed Supabase budget. EODHD caching is currently per process, not a shared multi-instance cache; establish global budget/usage monitoring before a multi-user launch. A provider outage may still add one fallback attempt and latency.

Live quotes, completed daily candles, reported financial periods and forecasts have distinct dates and meanings. Missing values stay null; genuine zeros are retained. Forecast EPS is not labelled GAAP EPS. Foreign issuer per-share valuation is withheld when share/ADR currency comparability is not established. Future earnings do not have actual results. Ownership is a delayed report, not live whale buying.

The EODHD REST stock quote is labelled delayed/indicative. The subscription's separate WebSocket service is not implemented in this release. Long-term decisions do not require streaming every symbol. No options/gamma add-ons, transcript license, market-wide bulk ingestion, FMP purchase or other paid service was added.

The user reports configuring EODHD_API_KEY externally. Local paid-account verification remains blocked by access, not by a demonstrated provider failure. Public demo checks are recorded in verification/eodhd-demo-check.json and eodhd-demo-normalization.json. Check APP, HIMS, OSCR, IREN, ASTS, SAP, BTC/USD and ETH/USD on the deployed preview before deciding whether either subscription is redundant.

## Official references used

- https://eodhd.com/pricing
- https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds
- https://eodhd.com/financial-apis/api-for-historical-data-and-volumes
- https://eodhd.com/financial-apis/intraday-historical-data-api
- https://eodhd.com/financial-apis/search-api-for-stocks-etfs-mutual-funds-and-indices
- https://twelvedata.com/docs
- https://twelvedata.com/docs/fundamentals/logo

Provider documentation does not verify the user's individual entitlement, current ticker completeness or permission to resell displayed data. ValueSnapshot's public attribution and research inventory remain in VALUESNAPSHOT_RESEARCH_AUDIT.md; stronger data access alone does not prove a better product.
