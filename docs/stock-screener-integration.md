# Stock screener: bounded integration

Verified against official https://sentisense.ai/docs/api/screener/ on 2026-11-18.
The documentation labels the stock screener Free (API key required), with 30 requests/minute Free and 300/minute PRO. No subscription, add-on, key or environment flag was purchased/changed. Actual configured-key access has not been tested live.

## Included
- Fixed server-only POST `/api/v1/screener/execute`; one numeric condition and corresponding sort; at most100 returned rows. Six documented fields: price, market capitalization, analyst-rating count, analyst target upside,1Y return,30D volatility.
- Explicit user-triggered screen only. Server account/daily allowance, deployment sample-only guard, overview feature entitlement, monthly research reservation,6/user/minute and distributed20/minute screener ceiling in production.
- Provider authorization/rate failures are surfaced without leaking response bodies or credentials. No fallback data, no automatic retries/polling, no bulk per-result calls.
- Closed result schema strips proprietary sentiment/rating/score fields and other unrequested properties. Missing stays missing; zero remains zero. Invalid symbols/duplicates/oversized result count rejected.
- `matched` versus returned count visible.25-row client pagination does not pretend to fetch beyond the100-result cap; refine filter instead.
- Quote observation uses `priceAsOf` milliseconds only. Missing timestamp stays unknown; `lastUpdated` snapshot seconds never stand in for quote freshness. Prices delayed; currentPrice shown in quote units without guessing currency. Other percentage columns use documented percentage-point units, not an extra100 multiplier.

## Not covered / constraints
- This is a constrained stock screener, not all provider endpoints or every paid-plan capability. No ETF screener, arbitrary compound filters, provider-created sentiment scores, dynamic field catalog or curated screens in this slice.
- Plan inclusion in official docs does not establish configured-key entitlement or commercial redistribution licensing. Existing commercial/license review remains unresolved; this work does not certify it.
- The20/minute shared limiter covers this route only. Existing SentiSense adapter traffic and other applications using the same key are not in that ledger. Provider429 is authoritative; complete cross-route provider quota coordination remains a separate task.
- No live data acquisition, purchase, order, account mutation or deployment performed. Synthetic tests validate contracts, not availability or investment usefulness.
- Paid data already has app paths (analyst estimates, ownership, options aggregates, reports); endpoint-by-endpoint live entitlement/coverage has not been audited here. Contract Greeks continue using existing configured Alpaca path, not this screener.

Independent-review corrections: analyst/technical filters now require their respective app features. A price or size screen redacts columns from unavailable domains and names those withheld domains explicitly. Future quote timestamps are null, not fresh observations. The request sends only the chosen field/operator/numeric threshold and100result limit to the provider, never user identity, holdings, saved tickers or watchlist contents.

The supplied Figma Discover reference has a quality/expectations/Pace bubble map and evidence-change lists. This endpoint does not supply authenticated comparable business-quality/Pace/evidence-change inputs; those visuals were not fabricated. This slice uses the reference's clean card hierarchy and a factual paged comparison instead. An equivalent Discover map needs separately verified inputs and explicit axis definitions.
