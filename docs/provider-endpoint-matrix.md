# Provider endpoint-to-feature matrix

Status for every row below is **documented-unverified**. The adapter and contract test exist, but no paid-account credential or entitlement evidence was available. A successful credentialed response is required before an endpoint can be marked verified.

## SentiSense Pro

The focused matrix below retains 18 named adapters used directly by Auryn screens. `src/server/sentisense-catalog.js` additionally provides a safe callable inventory for all 112 documented data endpoints across Market Mood, Metrics, Rating, Insights, Documents, Market Summary, Stocks, Analyst, Calendar, Earnings, ETFs, Options, Screener, Entities, Institutional, Insider, Politicians, Indexes and Trackers. Path parameters are required and encoded; GET query and POST body behavior is contract-tested.

### Focused named adapters (18)

| Adapter | Method and documented path | Auryn feature | Contract |
|---|---|---|---|
| `price` | GET `/api/v1/stocks/price` | delayed quote | positive numeric price |
| `profile` | GET `/api/v1/stocks/{ticker}/profile` | company profile | non-empty object |
| `rating` | GET `/api/v1/rating/{ticker}` | composite rating | rated flag, score/grade and as-of |
| `analystRatings` | GET `/api/v1/analyst/{ticker}/consensus` | analyst consensus | typed consensus object |
| `analystEstimates` | GET `/api/v1/analyst/{ticker}/estimates` | forward estimates | typed object; normalized separately |
| `earnings` | GET `/api/v1/stocks/{ticker}/earnings-summaries` | earnings summaries | list envelope |
| `earningsReactions` | GET `/api/v1/stocks/{ticker}/earnings/reactions` | earnings reactions | object envelope |
| `whatChanged` | GET `/api/v1/stocks/{ticker}/what-changed` | filing changes | list envelope |
| `kpis` | GET `/api/v1/stocks/{ticker}/kpis` | company KPIs | object envelope |
| `fundamentalsCurrent` | GET `/api/v1/stocks/fundamentals/current` | current fundamentals | object envelope |
| `insiders` | GET `/api/v1/insider/trades/{ticker}` | insider trades | list envelope |
| `politicians` | GET `/api/v1/politicians/filings/{ticker}` | politician filings | list envelope |
| `institutionalHolders` | GET `/api/v1/institutional/holders/{ticker}` | institutional holders | list envelope |
| `optionsSummary` | GET `/api/v1/stocks/{ticker}/options/summary` | options summary | object envelope |
| `insights` | GET `/api/v1/insights/stock/{ticker}` | stock insights | list envelope |
| `calendar` | GET `/api/v1/calendar/earnings` | earnings calendar | list envelope |
| `screener` | POST `/api/v1/screener/execute` | screener execution | JSON body and object envelope |
| `screenerFields` | GET `/api/v1/screener/fields` | screener field catalog | object envelope |

## EODHD

The focused matrix below retains 15 named adapters used directly by Auryn screens. `src/server/eodhd-catalog.js` represents 90 documented HTTP contracts across market data, company data, technicals, macro, calendars, references, screening, Treasury, credit, sanctions, rates, real estate, SEC filings, Cboe, ESG, options, logos, TradingHours and marketplace products. Weighted costs are attached where documented. WebSocket and separate real-time-host transports are not included.

### Focused named adapters (15)

| Adapter | Method and documented path | Auryn feature | Contract |
|---|---|---|---|
| `quote` | GET `/api/real-time/{symbol}` | delayed/indicative quote | positive numeric close |
| `history` | GET `/api/eod/{symbol}` | adjusted EOD history and Pace | dated positive rows |
| `intraday` | GET `/api/intraday/{symbol}` | intraday history | list envelope |
| `fundamentals` | GET `/api/fundamentals/{symbol}` | fundamental cases | General plus normalized statements |
| `news` | GET `/api/news` | news | list envelope |
| `sentiment` | GET `/api/sentiments` | news sentiment | object envelope |
| `earnings` | GET `/api/calendar/earnings` | earnings calendar | object envelope |
| `dividends` | GET `/api/div/{symbol}` | dividends | list envelope |
| `splits` | GET `/api/splits/{symbol}` | split evidence | list envelope |
| `technical` | GET `/api/technical/{symbol}` | technical indicator | list envelope |
| `insiderTransactions` | GET `/api/insider-transactions` | insider transactions | list envelope |
| `search` | GET `/api/search/{query}` | symbol search | list envelope |
| `exchangeSymbols` | GET `/api/exchange-symbol-list/{exchange}` | exchange universe | list envelope |
| `exchanges` | GET `/api/exchanges-list` | exchange catalog | list envelope |
| `account` | GET `/api/user` | plan evidence | object envelope |

## Runtime controls

- Credentials remain server-side; missing credentials produce zero outbound calls.
- One shared scheduler per provider enforces concurrency, start spacing, and a 10-second timeout.
- 401, 403, 404, 429, malformed JSON and schema failures have distinct states. A 404/no-coverage response never verifies entitlement.
- Cache keys include request parameters. Rate limits, timeouts, malformed responses, and provider errors are not cached.
- `GET /api/provider-matrix` exposes the focused named adapters; `GET /api/provider-catalog` exposes the broader callable inventories without credentials or secrets.
- Catalog metadata is not a credentialed proxy and is not counted as screen integration. The user-facing `/api/research/{ticker}/intelligence` route is a fixed allowlist with cache keys, entitlement observation, and provenance for six research sections.

This is a focused Auryn surface, not a claim to cover every product or every endpoint sold by either provider.
