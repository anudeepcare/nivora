# NIVORA V57.2 — Performance & Consistency

## Fixes
- Technical Starter / Accumulate / Strong Accumulate zones are ordered and non-overlapping.
- Missing absolute valuation remains N/A; relative valuation is labeled separately.
- Stock evidence requests now start in parallel instead of waiting behind market history.
- A five-minute in-session warm cache makes back-to-back/revisited stock analysis much faster.
- Core technical refresh cadence is reduced to once/minute to avoid unnecessary provider load.
- SAP SE (`SAP`, NYSE) is explicitly resolved in search and market-data requests.
- Twelve Data market-history payload reduced while preserving one-year/200-day calculations.
- Behavioral tests cover zone ordering and missing-valuation integrity.
