# AURYN combined source — 12 November 2026

This is the single combined release. Deploy the **AURYN** directory. The sibling **reference-data** directory is reproducibility evidence, not application runtime data.

## Included

- Active monthly-v7 Pace forest: 250 frozen trees, the existing 42 price features, float32 inference matching the evaluated candidate.
- Research, conditional price boundaries, sampled price zones, history insights and current Strategy Lab use the new policy for eligible post-release equity readings.
- Light and strong trim classifications map to P0 with their actual tier. P0/P1 retain cash; P2/P3/P4 retain the existing contribution plan.
- Earlier observations and crypto keep their prior policy. No older returns are relabeled as v7 results.
- Analyst Bear/Base/Bull headline uses low / consensus / high with the latest settled-close reference. After-hours prices no longer change those percentages. Intrinsic values cannot silently replace analyst targets.
- Earlier cash-flow contraction, valuation selection and analyst headline fixes are included.

## Measured Pace agreement

| Comparison | Matches | Result |
|---|---:|---:|
| Stocks excluded from fitting, active engine | 205 / 223 | **91.9%** |
| Full requested reference snapshot | 971 / 1,000 | 97.1% |
| Same-price observations | 970 / 997 | 97.29% |
| Exported forest predictions reproduced | 995 / 995 | 100% inference parity |

The full snapshot includes fitting rows and is an alphabetical ticker sample containing some funds and a crypto pair. It is not independent market-wide accuracy. One requested money-market instrument lacked usable history; it stays in the 1,000 denominator. The 223 observations were excluded from fitting but the dataset had previously been inspected. None of these percentages measures investment-return accuracy or guarantees future reference agreement.

The complete per-ticker results, mismatches, split, frozen model and input histories are included. The original v6 comparison is preserved separately.

## 500-stock analyst comparison

The requested scope is **500**, not four. `verification/bundled-v7-20261112/analyst-cohort-500.json` fixes that cohort. The four screenshots are calculation fixtures only. **Zero live provider/reference pairs have been verified for the 500-stock analyst cohort.** Do not label this bundle “500 analyst targets matched.”

Observed access results: the connected Twelve Data price-target endpoint requires Ultra/Enterprise; Vercel confirms a protected EODHD key exists but does not return its value; the deployment fetch returned HTTP 401. No subscription, environment variable or deployment was changed.

To finish the comparison, capture dated low/consensus/high, analyst count and settled close from both sources for all cohort stocks. JSON records use the `AnalystSnapshot` schema in `lib/analyst-parity.ts`. Run:

```sh
node --experimental-strip-types scripts/compare-analyst-500.mjs verification/bundled-v7-20261112/analyst-cohort-500.json reference.json actual.json report.json
```

The command exits nonzero unless every requested stock matches. Missing rows, differing reference dates, prices, targets or counts cannot produce a pass.

## Reproduce Pace

From AURYN, after `npm ci`:

```sh
node --experimental-strip-types scripts/replay-reference-v7.mjs ../reference-data verification/reproduced-v7.json
node scripts/verify-pace-candidate-export.mjs verification/analyst-and-pace-20261112
npm run verify
```

The v7 replay deliberately runs the Nov 11 snapshot at the Nov 12 release date and is labeled post-fit. It does not pretend the model existed at the historical signal date.

## Deployment

Use Node 24 and the existing provider/application environment configuration. No secrets, dependencies, build output or old source ZIPs are included. The source is prepared for review/preproduction; nothing was deployed by this release.

`npm ci` → `npm run verify` → deploy the AURYN directory using the existing project configuration.

Optional public Pace publication requires `scripts/sql/enable-pace-v7.sql`. This changes only the allowed policy-version constraint and preserves append-only privileges. It has not been run against your database. Ordinary Pace calculations do not require this migration.

## Software checks

1,375 tests passed. After removal of a redundant type guard, the four v7 tests passed again, together with lint, formatting, type checking and a production build. ZIP CRC and every manifest hash are checked during packaging. No browser visual pass is claimed for this release.
