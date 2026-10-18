# Research cleanup

Removed Data coverage & definitions from Research as requested. Tightened case highlights and grouped News earnings/insider sections. Insider data is labelled reported, not recent, because supplied records can be old. These are interface changes only. No new paid calls or endpoint integrations were added.

197 tests, TypeScript, production build and 64 API fixture checks passed. The attached iPhone screenshot confirms the prior header mitigation did not resolve the visual blur. Physical installed-PWA reproduction and a validated fix remain unavailable here; no additional experimental header CSS was added in this cleanup. Exact mock parity and full production acceptance remain open.

API documentation was reviewed: EODHD fundamentals includes statements, valuation, share statistics, earnings, ownership and insider data; separate historical market-cap and corporate-events endpoints are documented. Twelve Data documents earnings, statistics, dividends/splits and analyst estimates/recommendations. Documentation alone does not verify personal account entitlement. Priority candidates are dated estimate changes, historical valuation context and corporate actions. These are candidates, not implemented features.

References: https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds ; https://github.com/EodHistoricalData/EODHD-openapi ; https://twelvedata.com/docs .

Deployment commands remain in TAB_LAYOUT_20261018.md. Commit message may be changed to Remove research coverage block and simplify highlights.
