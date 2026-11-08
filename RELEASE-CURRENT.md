# Current release — enabled Pace v6 and cleaner research

This release supersedes earlier notes saying the candidate was offline or monthly-v5 remained the current app engine.

## App changes
- Enabled the frozen monthly-v6 technical classifier in the shared analysis engine used by Research and portfolio/watchlist assessments. No per-ticker overrides or runtime training.
- Preserved monthly-v5 historical readings before the model cutoff and fallback for crypto/insufficient history. Legacy backtests remain explicitly labeled.
- Current conditional levels are recalculated using the new classifier; obsolete v5 buy thresholds are not displayed for v6 readings.
- Pace remains first on Overview. Historical closing zones stay distinct from current provisional zones.
- Removed duplicate valuation scenarios. Restored coral/gold/teal bear/base/bull styling; negative percentage changes remain negative regardless of scenario label.
- Targets uses the same selected default scenario model; explicit user P/E assumptions remain separate.
- Removed repeated earnings thesis/preparation commentary and redundant notes fetching. Kept actual EPS, estimate, surprise, next report date and earnings history.
- Removed the long options-map tutorial and its unused CSS.

## Verification
The actual shared TypeScript engine reproduces all 589 saved candidate outputs exactly. In the saved reserved subset, agreement is 159/182 (87.4%); reference deeper categories match 53/69 (76.8%). This explored snapshot is not independent future-date validation or return-prediction accuracy. No 99% claim.

## Delivery
Source only; no deployment or database changes. Optional public Pace record publishing requires scripts/sql/enable-pace-v6.sql to accept the new version. App display/calculation does not require that SQL. Existing public-record permissions are preserved. No newly verified APP forecast values are claimed.
