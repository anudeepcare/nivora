# US annual macro context

Scope: **GDP growth only**, not inflation or unemployment. Optional button in existing EconomicContext; no request before explicit opening, one fixed country/indicator request. Existing authenticated news feature gate, sample-only denial, per-user allowance and six-per-minute route limit apply. Shared EOD transport/cache reserves ten credits per upstream request (`macro-indicator` explicit cost rule), cache interval 24h; no new credentials or migrations.

Official contract checked 2026-11-18: https://eodhd.com/financial-apis/macroeconomics-data-and-macro-indicators-api . Fixed `macro-indicator/USA?indicator=gdp_growth_annual`; Annual rows with GDP growth (annual %) indicator label. Country, unit label, period, finite/null values, duplicates and future period ends validated. Latest 20 returned observations displayed without interpolation; zero and negative growth remain actual values.

Date is annual period end, not publication. World Bank WDI source through EODHD; revisions can occur and historical vintages/publication timestamps are not provided. Check timestamp means request handling, not upstream acquisition. This is not real-time activity, quarterly annualized GDP, or a forecast. Errors/empty history are explicit and no fallback series is invented.

Only fixture tests and official documentation verified, not live entitlement or actual-account endpoint access. No provider call, migration, deployment or new subscription performed.
