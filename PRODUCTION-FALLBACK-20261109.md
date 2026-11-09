# Production fallback restored — November 9, 2026

This note supersedes earlier scenario coverage claims. It does not claim analyst-range or intrinsic-value coverage for every stock.

## Verified baseline
Production auryninvest.com resolves to READY deployment nivora-bna30tse6-anudeeppaleru.vercel.app, main commit d6b51bd222f6f3c9d88748398dd8b176b3d69ed0. Remote preprod remains 08e673eca29824ead7470b24c964a3ac4c09702f. No remote changes made.

Production lib/approved-research.ts falls back from ineligible business scenarios to priceRiskScenarios. The newer overview had dropped that fallback. The production and candidate lib/price-risk-scenarios.ts are byte-identical.

## Correction
The overview now uses the existing PriceRiskCases component when no valuation qualifies and usable price history exists. Qualified cash-flow/earnings models still take precedence. Analyst consensus remains separate. Both CompanyMetrics and ResearchEvidenceGrid remain directly visible. No provider subscription, model formulas, DCA decisions or production files were changed.

Historical downside/midpoint/upside are labelled as past-return percentiles, with horizon, dated reference, sample count and limits. They are not analyst low/consensus/high, fundamental bear/base/bull, future probabilities or a guarantee. Missing/stale/short/discontinuous histories remain unsupported.

## Real data validation
Authenticated Twelve Data time_series supplied 320 daily OHLCV records per symbol through 2026-11-06. Applied unchanged production algorithm locally, using settled close as reference and observation clock 2026-11-09T00:00:00Z. Each generated 257 overlapping 63-session return windows.

| Symbol | Reference | Historical downside | Historical midpoint | Historical upside |
|---|---:|---:|---:|---:|
| IREN | 21.64 | 14.88 | 19.67 | 34.90 |
| HIMS | 26.00 | 14.28 | 22.41 | 39.86 |
| CIFR | 6.545 | 4.10 | 6.59 | 13.88 |
| NBIS | 129.49001 | 101.71 | 151.58 | 287.10 |
| ASTS | 32.33 | 21.50 | 33.12 | 49.68 |
| APP | 391.22 | 231.21 | 340.42 | 514.04 |
| MSFT | 530.60999 | 424.78 | 517.24 | 697.34 |

These are real provider price-history replays, not live production UI observations or full fundamental-model validations. Different history windows/quotes can yield different ranges. Raw provider histories are not bundled in the source ZIP.

## Verification
- Regression reproduced missing overview output before fix; passed after fix.
- Full suite: 1,310 passed, 0 failed.
- Lint and format check passed.
- Next production build passed, including type validation.
- Existing SSR rendering regression verifies both Research metric grids.
- Synthetic hand-calculated history test verifies output and preserves qualifying APP/MSFT models; synthetic inputs are not live stock data.
- Production browser redirects to its separate sign-in. No authenticated production rendering, new candidate browser/mobile validation, or live end-to-end provider fallback certification claimed.
- Existing build warnings: Next ESLint plugin not detected; npm http-proxy configuration warning.

## Remaining limits
The authenticated Finnhub key works for company profile but price-target returns HTTP 403. Twelve target access is also unentitled. Existing EOD feed supplies consensus without verified low/high. No new source, purchase or invented range was added. Growth-company independent fundamental models still require supported company-specific data and assumptions; this restoration does not solve that separate problem.

No push, deployment, production data change, vendor contact, subscription change or permission change.
