# Numerical recovery verification — November 13, 2026

## Results

- Fresh active-v7 wrapper replay: 971/1,000 requested (97.1%), 999 compared, 997 date/price aligned, 970 aligned matches (97.2919%).
- 28 compared category mismatches plus AGPXX's saved provider error. Strict exact acceptance exits 1 as expected; it is not met.
- 223 stocks excluded from fitting: 205 active-wrapper matches (91.9283%). Training/held-out symbol intersection is empty (772 / 223 split).
- Frozen exported forest and active classifier each reproduce 995/995 saved candidate predictions. Active and exported trees/classes are identical; descriptive metadata differs.
- Fresh per-ticker replay results equal the bundled prior results after excluding runtime milliseconds.
- The replay uses historical saved inputs at the Nov 12 release timestamp. The full sample includes fitting rows; held-out rows come from a previously inspected dataset. These are reference-category comparisons, not future-date, blind, market-wide, or investment-return accuracy.

## Analyst comparison

The saved 500-symbol cohort is unique. Only four screenshot reference fixtures and zero actual provider snapshots are bundled. Rerunning the strict comparator gives requested=500, compared=0, matches=0, completeExactMatch=false and exits 1. This measures missing evidence, not demonstrated 0% agreement among observed pairs.

A fresh connected Twelve Data quota call returned timestamp=2026-11-13 13:02:45, current_usage=1, plan_limit=0. This does not establish a usable bulk-call quota. One AAPL price_target probe succeeded, so the historical Ultra/Enterprise denial is stale. Its response has low/average/high, currency and current price, but no analyst count or dated settled close. No 500-symbol request batch was made. No provider credentials were available in the process environment or local repo .env files; secret values were neither requested nor disclosed. Historical Vercel/EODHD and protected-deployment access findings were not rechecked and must not be presented as newly observed blocks.

Completing 500 comparisons still requires independently captured same-date reference/provider snapshots for the whole cohort, including currency, settled close/date, low/consensus/high and analyst count, plus confirmation of available provider quota. Current values cannot be substituted for Nov 11 observations. The single endpoint probe is not a complete AnalystSnapshot and was deliberately not inserted as one.

## Commands (run from auryn-recovered, Node v24.22.1)

```sh
node --experimental-strip-types scripts/replay-reference-v7.mjs ../auryn-reference/auryn-reference verification/recovery-20261113/pace-replay-1000.json --require-exact
# exit 1: full parity not met
node scripts/verify-pace-candidate-export.mjs verification/analyst-and-pace-20261112
# exit 0: 995 inference parity checks; held-out 205/223
node --experimental-strip-types scripts/compare-analyst-500.mjs verification/bundled-v7-20261112/analyst-cohort-500.json verification/bundled-v7-20261112/analyst-screenshot-samples.json verification/bundled-v7-20261112/analyst-provider-observations.json verification/recovery-20261113/analyst-comparison-500.json
# exit 1: 0 observed pairs out of 500 requested
```

Additional evidence: pace-heldout-active.json, active-classifier-parity.json, export-parity.json, split-integrity.json and analyst-access-current.json. No code changes, installs, builds, deployments, purchases or database writes were made by this numerical verification task.
