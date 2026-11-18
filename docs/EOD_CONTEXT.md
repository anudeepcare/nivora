# Optional dividend and macro context

Events now offers three explicitly selected datasets. Only the selected dataset loads; preview does not call providers. Existing shared provider caching/quota applies. Access requires news permission and a non-sample deployment.

- Dividend calendar: selected supported equity, next 30 days, first 100 rows maximum. The documented calendar supplies **dividend date and symbol only**, not an explicit ex-date classification, cash amount or payment date. Identity is validated; partial pages are disclosed without following provider URLs.
- US economic events: next seven days, up to 100 provider rows, 30-minute shared cache. Reported date/time is retained without inventing a timezone; raw nullable values are not assigned absent currency/percentage units. Provider limit can make the calendar partial.
- Nominal US Treasury curve: current-year source cached six hours, latest single dated observation. Missing tenors are not backfilled from another day. The 10Y–2Y spread is shown only with both supplied values at that date. It does not alter company valuation, option inputs or risk-free-rate assumptions.

Official documentation consulted:
- https://eodhd.com/financial-apis/calendar-upcoming-earnings-ipos-and-splits
- https://eodhd.com/financial-apis/economic-events-data-api
- https://eodhd.com/financial-apis/us-treasury-ust-interest-rates-api-beta
- https://eodhd.com/pricing

Published plan documentation supports All-In-One inclusion. This implementation has not made authenticated live endpoint calls, so current account access and real returned coverage remain unverified. No paid Marketplace endpoint, package or subscription is activated.

Transport hardening: fetch rejects redirects; streamed UTF-8 JSON is capped at 2 MiB for these context feeds and 16 MiB for other existing EOD routes, failing visibly rather than truncating values. Context metadata is `checkedAt`, with the cache TTL disclosed, not a claimed fresh provider retrieval timestamp. True provider acquisition time is not supplied by the existing shared cache contract.
