# Pace discrepancy audit, November 14, 2026

## Result
Fresh execution of archived inputs reproduces 971/1,000 exactly: 999 compared, 28 disagreements and one provider error. This is not fresh market evidence or untouched validation. The excluded-from-fit frozen-feature test remains 205/223, with all 995 exported model predictions reproduced.

## Causes
- 25 model/reference category disagreements: 7 development rows and 18 excluded-from-fit rows. No proven implementation bug explains these; no thresholds were adjusted.
- AHRT: only nine consecutive completed prior months (February–October 2026). BSP: only four (July–October 2026). Historical gaps prevent the required twelve-month reading. Returning no reading is correct; inventing a 1X label would not be a fix.
- BLOK: reference 51.75 versus provider 51.70 on November 11. Price-basis mismatch is established, but is not proven to cause the category disagreement.
- AGPXX: provider returned invalid-symbol error, not usable bars. Missing observation stays in the denominator.

## Real code defect fixed
The offline feature-extraction script used unvalidated raw daily bars whereas the app used settled, validated bars. It now uses the same normalization and filters through the actual signal date. A synthetic impossible OHLC bar produced feature distance 99 instead of 0 before the fix; the regression now passes. Saved feature differences occur for BBT and CCC, but both classifications stay unchanged. The fixed extraction script was rerun on all 997 aligned equity observations and produced 995 eligible feature vectors. Each row retained its own reference close date. Model files and frozen training evidence are intentionally unchanged.

## Evidence
- replay-v7.json: complete archived-input replay results, unchanged reference/model hashes. Raw licensed histories are excluded from the ZIP.
- diagnosis.json: all 29 unresolved observations and exact categories.
- raw-feature-parity.json / extraction-parity.json: normalization differences, with unchanged classifications.
- The release verification summary records the failed-before/passed-after regression and frozen-model checks. Local execution logs are not included in the source ZIP.

No purchases, deployments, external writes or model refits were performed.
