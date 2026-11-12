# Analyst close correction and Pace candidate — 12 November 2026

## Shipped correction
Analyst low/consensus/high comparisons now prefer the latest completed daily close over a later after-hours quote. This changes the reference price for analyst comparisons only; it does not replace AURYN intrinsic valuation cases with analyst opinions or inject screenshot values into the live app.

Four regression fixtures reproduce the user's screenshots, including positive bear-case upside for IREN:

| Ticker | Settled close | Low | Consensus | High | Whole-percent gaps |
|---|---:|---:|---:|---:|---|
| NFLX | 64.54 | 57.00 | 84.76 | 126.00 | -12 / +31 / +95 |
| IREN | 20.84 | 23.00 | 56.69 | 139.00 | +10 / +172 / +567 |
| NBIS | 154.69 | 84.00 | 278.05 | 410.00 | -46 / +80 / +165 |
| NOW | 102.76 | 72.00 | 155.82 | 266.00 | -30 / +52 / +159 |

All four failed before the correction because a later quote replaced the settled close. All four pass afterward. These are supplied-observation calculation fixtures, not independently retrieved live analyst-feed matches. The existing UI retains its one-decimal percentage formatting; the whole-number values above use the reference screenshot's rounding.

## Analyst feed checks
The connected Twelve Data price_target endpoint returned an Ultra/Enterprise entitlement requirement for NFLX, APP and NBIS. No subscription was changed. EODHD's adapter already accepts optional TargetPriceLow and TargetPriceHigh fields. Its published AnalystRatings glossary defines TargetPrice as the average target and does not list those low/high fields; the actual subscribed EODHD response was not accessible in this workspace. Therefore the earlier shorthand that the adapter itself supplies only consensus was too broad.

Reference: https://eodhd.com/financial-academy/financial-faq/fundamentals-glossary-common-stock

## Pace research result
The live comparison dataset remains preserved in the prior 1,000-ticker evidence ZIP. Of its rows, 997 have aligned equity close prices; 995 have the full existing feature vector. Two short-history rows are excluded from this candidate study, not silently counted as matches.

The candidate uses the existing 42 price features, explicitly models both trim categories, and is selected by development-only three-fold grouped validation. Known share classes are grouped. The outer split was fixed before fitting this candidate. The reference snapshot had already been inspected, so this is not a pristine blind or later-date test.

| Group | Baseline matches | Candidate matches |
|---|---:|---:|
| Held out from fitting | 181 / 223 (81.17%) | 205 / 223 (91.93%) |
| Development | 633 / 772 | 765 / 772 |

Do not use combined fitted-and-held-out agreement as independent accuracy. Only one light-trim row and no strong-trim rows are in the outer holdout. P3 improves from 5/15 to 7/15; substantial errors remain. The candidate is not activated in the application or deployed. Existing application Pace remains monthly-v6 and its previous full-reference result remains 815/999. No 100% equivalence or predictive return accuracy is claimed.

The research model is exported as JSON, with its input hash and training tickers. An independent JavaScript evaluator reproduces all 995 Python-model predictions, including the 205/223 held-out result. This verifies export/inference consistency, not correctness of every reference verdict.

## Reproduction
From the AURYN source directory, with Node 24:

```sh
npm ci
npm run verify
node scripts/verify-pace-candidate-export.mjs verification/analyst-and-pace-20261112
```

For the last command, the included research files are stored directly under verification/analyst-and-pace-20261112; the verifier also accepts the original evidence folder containing its analysis directory.

To regenerate features and the candidate using the earlier raw-history evidence ZIP, run scripts/extract-live-pace-features.mjs with that evidence folder, then scripts/study-live-pace-candidates.py. The Python study requires NumPy and scikit-learn. Model weights are not imported into the app bundle.

No production deployment, billing action or database change was made.

Software verification: npm run verify passed lint, formatting, all 1,365 tests, type checks and production build. Subsequent owner-guide documentation changes were separately formatted and type-checked.
