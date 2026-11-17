# Live contract acceptance (not yet run)

“Integrated” means a fixed, allowlisted server route has a real screen consumer. It does not mean the paid plan, entitlement, payload shape, or security identity has been verified. Provider credentials were unavailable, so every contract below remains `pending-live-verification`.

| Screen flow | Fixed app route | Provider contracts used | Required live acceptance evidence |
|---|---|---|---|
| Header search | `GET /api/search?q=` | EODHD search | Canonical code/exchange mapping, share classes, malformed rows, empty coverage and rate limits |
| Research: Pace | `GET /api/research/{canonicalSymbol}` | EODHD quote + EOD history | Exact returned identity, USD currency, timestamp, split-adjustment semantics, complete settled months |
| Research: scenarios | same | EODHD v1.1 fundamentals; SentiSense analyst estimates | Filing availability dates, contiguous USD quarters, estimate fiscal periods/currency, preview/sample flags |
| Research: analyst evidence | same | SentiSense rating + analyst ratings/estimates | Full response variants, target units, coverage state, provider timestamp |
| Research: news/options/ownership/earnings | `GET /api/research/{canonicalSymbol}/intelligence` | EODHD news/dividends/insider transactions; SentiSense documents, earnings, holders, insiders, politicians, options summary | Date-window behavior, provenance, ownership units, option ratio/IV units and timestamps, nullable fields |
| Portfolio valuation | `POST /api/portfolio/quotes` | EODHD quote | Requested/returned identity equality, explicit USD, nonfuture timestamp and delay classification |
| Screener | none | none in the screen | Current screen is offline structural filtering only. The documented SentiSense screener adapter is not a product integration. |

The acceptance-plan builder is intentionally capped at five exchange-qualified securities and lists only five critical operations per security. It contains no secret, performs no request by itself, and specifies status/provenance-only output. A live run must not retain bulk provider payloads.

Catalog entries outside this table are callable server adapters or metadata, not user-facing coverage. WebSockets, alternate real-time hosts, and unverified marketplace transports remain excluded.
