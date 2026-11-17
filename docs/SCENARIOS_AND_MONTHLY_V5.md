# Bear/base/bull and monthly-v5 follow-up — 23 October 2026

## What changed

Overview and Value now lead with numeric Bear / Base / Bull cases. Supported earnings cases remain first. When company earnings inputs are insufficient or fail reconciliation, the fallback is **historical price-risk cases**, explicitly labelled with a 20- or 63-session horizon. The fallback is not analyst consensus, company fair value, or an intrinsic valuation. Analyst opinion remains available separately in Analysts.

Historical cases apply the observed 10th, median and 90th percentile rolling log-price outcomes to a dated reference price. They use split-adjusted settled history, filter future and invalid candles, exclude windows with major gaps, and require at least 80 observations and 40 usable windows. A current dated quote is preferred; if unavailable, a recent settled historical close is explicitly identified. There are no invented EPS forecasts, analyst bounds or business assumptions. Overlapping windows are dependent, so percentile labels are not forecast probabilities. The three outcomes can all be above or below the reference. A valid numeric result is still impossible without sufficient data.

The calculation is linear through the history before sorting the return sample. It adds no API request or paid model call. EODHD remains primary with Twelve fallback. Existing PWA shell, authentication, portfolio records and approved entry/Home layouts are retained.

## Original monthly-v5 policy

The previous 12 completed monthly closes define the cycle average and sample spread, with a 10%-of-average spread floor. Thresholds are:

| Contribution condition | Below cycle average | Spread units below average |
| --- | --- | --- |
| 2× | 10% | 0.50 |
| 3× | 25% | 0.95 |
| 4× | 35% | 1.30 |

Both gates must pass. Additionally, 3×/4× require the price to be at or below the average of the available prior closes (up to 24 months). When the short and longer cycles disagree, stronger upsize is capped at 2×; the 3×/4× price boundaries include the same corroboration gate. Existing robust-trend and severe-extension guards remain; trim reviews never specify a sale amount. The prior 24 months are used for the standard trend guard. A listing with only 12–23 prior complete months can now produce a reading, labelled **limited listing history**. Missing month ends, future/invalid/conflicting observations and non-finite outputs remain rejected. Confirmed and forming periods remain separate. Version 4 stays in the source and is still available for reproducible historical evaluation; default display/evaluation now use v5.

These are openly documented, empirically calibrated original rules, not recovery of a competitor's private algorithm. No ticker-specific branches, forced output mappings or unseen future inputs were introduced.

## Actual same-date comparison

Settled history through October 22, 2026 was compared against the supplied/reference monthly readings. Fresh SOFI/TTD/CRWV daily observations were downloaded separately; the historical query's exclusive end boundary initially omitted October 22, so that session was fetched explicitly and merged only after same-provider overlap checks.

| Ticker | Reference confirmed / forming | AURYN v5 confirmed / forming |
| --- | --- | --- |
| SOFI | 3× / 3× | 3× / 3× |
| TTD | 4× / 3× | 4× / 3× |
| CRWV | 1× / 4× | 1× / 4× · limited history |
| ONDS | 2× / 2× | 2× / 2× |

The complete 17-stock current sample, now including ONDS, matches **34/34 readings**, including IREN, APP, ASTS, MSFT, NU, HIMS, SAP, NBIS, CIFR, META, NVDA, NOW and BE. ONDS also influenced the longer-cycle guard. This sample influenced calibration and is not an independent holdout. **Two older IREN reference months now differ:** March and April 2025 are 3× versus reference 2×. Historical agreement is 24/26. Weekly parity remains separate and unresolved. No universal parity or performance claim is made.

Historical price-risk cases were calculated on actual daily histories for all 16 checked stocks. This does not certify every live ticker, every entitlement or every company-specific fundamental valuation. The example risk prices in the report must not be presented as analyst targets or investment recommendations.

Reports: `verification/monthly-v5-reference-audit.json` and `verification/price-risk-multi-ticker-audit.json`. Licensed raw series and private screenshots are not bundled.

## Verification

457 tests pass, including short listing history, threshold distinctions, future exclusion, missing months, scale invariance, invalid input, intact empirical windows, hand-calculated geometric returns and rendered Bear/Base/Bull fallback. Production build and TypeScript pass; compiled API checks total 86, plus 12 local production HTTP checks. See `followup-complete-verify.log`, `followup-complete-api.log`, `followup-complete-http.log` and `REPORT.json`.

Source pixel matching, physical installed-iPhone behavior, live OAuth consent, production data parity and future outcomes remain unverified. No production push/deployment, paid upgrade, live database write or broker order was performed.
