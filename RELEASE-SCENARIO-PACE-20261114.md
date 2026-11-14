# Scenario and Pace verification, November 14, 2026

This is the complete source bundle, with `package.json` at the archive root. It preserves the prior application and UI. No purchase, provider-budget change, deployment, production write, database migration or model refit was performed.

## What was actually corrected

1. A matched market-cap/share/price snapshot could be years old and still supply shares to a current revenue scenario. The explicit-snapshot path now uses the existing reported-share path's 120-day age limit. Unsupported cases stay unavailable; independently supplied analyst targets remain visible.
2. The provider normalizer accepted impossible calendar dates such as February 30 because JavaScript rolled them into March. Those dates no longer establish dataset freshness or enter annual forecasts. Valid leap days remain accepted.
3. The offline Pace feature extractor used raw daily bars while the application used settled, validated bars through the reading date. The extractor now follows the same preprocessing. This is a research-pipeline correction, not a change to the active model or its predictions.

Four scenario/date regressions and one feature-extraction regression failed on the old implementation and passed on the corrected source. Existing source formulas, providers, thresholds, model files, UI components and styles are retained.

## Fresh preprod inspection

Read-only inspection used the existing signed-in preprod session on November 14 at about 01:05 UTC. These observations describe the already-deployed preprod, not this undeployed source patch.

| Stock | EODHD analyst consensus | Displayed settled close, Nov 13 | Live provisional Pace |
| --- | ---: | ---: | --- |
| IREN | $56.69 | $18.17 | P4 |
| NBIS | $271.20 | $115.88 | P2; decision uses prior confirmed P1 |
| APP | $449.61 | $409.10 | P1 |

All three still lack a complete analyst low/high range. Their main Bear/Base/Bull section explains that more company evidence is needed rather than manufacturing values. Scenario cross-check rows remain separately labelled; analyst consensus is the middle of its own incomplete row, not an AURYN valuation.

NBIS's live consensus is now $271.20 rather than the earlier $278.05. It and IREN's $56.69 numerically equal the saved reference-service consensus observations from November 13. The new AURYN captures have a different settled-close date and no supplied individual target-revision date, so this is **not same-date full-triple parity**. No new reference-site collection was performed. Exact URLs, visible values, dates and caveats are in `verification/preprod-targets-20261114/evidence.json`.

## Pace replay and unresolved differences

A fresh execution of the archived November 11 inputs reproduces **971/1,000** matches: 999 compared, 28 disagreements and one provider-invalid-symbol error. The previously inspected excluded-from-fit subset remains **205/223**. These are archived-input tests, not fresh-market or pristine blind validation.

- 25 disagreements are frozen-model/reference classification differences: seven development rows and eighteen excluded-from-fit rows. No implementation defect was proved to explain them.
- AHRT and BSP lack the required consecutive monthly history; no reading is returned.
- BLOK's provider/reference prices differ. That mismatch is established, but is not proved to explain its category difference.
- AGPXX's provider payload is an invalid-symbol error, not usable history. It stays in the requested denominator.

The corrected extractor reproduced 995 usable feature vectors from 997 aligned equity rows; BBT and CCC differ from the earlier saved vectors, but neither predicted class changes. Each symbol retains its own observation cutoff. No model was fitted to known errors, no reference labels were overwritten and no accuracy improvement is claimed. Detailed replay and diagnoses are in `verification/pace-audit-20261114/`.

## Remaining blocker

Matching a complete low/consensus/high triple requires a licensed, correctly dated complete target source and comparable reference evidence. The active [EODHD fundamentals documentation](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds) documents the mean, and the inspected live feed does not supply the bounds for these examples. An updated dataset date cannot establish an individual analyst target-revision date.

[Twelve Data's current price-target documentation](https://twelvedata.com/docs/analysis/price-target) specifies 75 credits per symbol. This exceeds the existing 55-credit application request ceiling. The previously saved successful AAPL probe does not establish usable current quota or permission to raise that ceiling. No new call to this endpoint or budget increase was made.

Complete analyst-range matching and exact Pace matching are therefore **not finished**. These fixes improve input correctness and reproducibility; they do not substitute missing market data or a proprietary reference formula.

## Verification

The final software checks and source/archive comparisons are recorded in `verification/scenario-pace-release-20261114/summary.json`. They distinguish lint, formatting, full unit tests, typecheck, production build and compiled API fixture checks. API checks use controlled transports, not paid market requests. Live inspection covers the three preprod examples above; this patch was not deployed or browser-tested as a new build.

Use Node 24.x, `npm ci`, `npm run verify` and `npm run test:api`. Raw licensed provider histories, credentials, dependencies and generated build output are excluded from the source ZIP. The ZIP has a regenerated SHA-256 manifest and integrity check.
