# Market-data provider strategy

Updated November 17, 2026. Only EODHD and SentiSense are authorized market-data sources. Missing coverage is disclosed, not replaced with another vendor or simulated financial output.

## Allocation

- EODHD: security search, quotes, historical prices, fundamentals, company profile, news, corporate actions, calendar events, screening and available company context. Reuse the existing shared cache, budget and access guards. These capabilities do not imply complete ticker coverage or individual subscription entitlement.
- SentiSense: dated analyst, earnings, ownership, insider/public-official, options and document evidence, company KPIs, stories and coverage discovery. Fixed endpoint identifiers only; no caller-controlled provider URLs. ETF analyst aggregates describe constituents and are not direct analyst targets for the fund.
- Quote times, completed price dates, financial period ends, estimates, holdings composition and retrieval times remain distinct. Missing values are not zero. Provider estimates never silently replace a calculation's required financial inputs.

## Exclusions and unresolved coverage

Twelve Data, SEC direct fallback, Finnhub and Alpaca market-data fallbacks are disabled. EODHD Marketplace options/UnicornBay is not assumed included. A full strike/expiry chain, dealer GEX or Vanna heatmap cannot be reconstructed from summary records. Paper execution, AI interpretation, authentication and email are separate services, not extra market-data vendors.

The adapter implements a selected fixed subset of the documented API, not every paid-plan endpoint. A successful build or public documentation is not verification of account entitlement, freshness, ticker completeness or display rights. Provider-level caching and concurrency limits are not a global subscription quota guarantee.

## Presentation and licensing

Customer-facing headings and errors use neutral product language. Source identity remains available in source details alongside dates and coverage. Do not remove mandatory attribution when a license requires it. Raw proprietary sentiment/Score is withheld pending verified display rights; an information icon alone does not satisfy a license requiring a visible provider link. Plan access and a commercial Data License are different requirements.

Keep options stock and ETF universes separate. Do not expose vendor scores as a new product ranking, infer buy/sell direction from volume, or call estimated premium traded cash. ETF holdings-weighted analyst upside is not a fund price target. Preserve partial-coverage and insufficient-coverage states.

## Official references

- https://eodhd.com/pricing
- https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds
- https://eodhd.com/financial-apis/api-for-historical-data-and-volumes
- https://sentisense.ai/docs/api/
- https://sentisense.ai/docs/api/stocks/
- https://sentisense.ai/docs/api/options/
- https://sentisense.ai/docs/api/etfs/

Live subscription checks and browser verification are recorded separately. This document makes no deployment or full-coverage claim.
