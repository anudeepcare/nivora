# Live reference comparison and valuation correction — 12 November 2026

## Measured result

Captured 1,000 distinct reference tickers directly from the signed-in DCA Optimizer screener. Retrieved daily histories for 999 of them and compared the actual AURYN monthly-v6 calculation engine at each reference close date. Exact category agreement: **815 / 999 (81.58%)**. Against all 1,000 requested rows, the count is **815 / 1,000**; the missing fund is retained in the denominator.

For matching close dates and prices within $0.011, agreement is **814 / 997 (81.64%)**. This is category agreement, not prediction accuracy. Full exact-match acceptance is **not met**. No 100% equivalence is claimed.

| Reference category | Compared | Exact matches | Agreement |
|---|---:|---:|---:|
| 1X DCA | 651 | 582 | 89.4% |
| 2X DCA | 104 | 62 | 59.6% |
| 3X DCA | 82 | 32 | 39.0% |
| 4X DCA | 151 | 139 | 92.1% |
| LIGHT TRIM | 7 | 0 | 0.0% |
| STRONG TRIM | 4 | 0 | 0.0% |

The sample is the first 1,000 tickers alphabetically (A–EFSI) under the site's U.S. stocks filter, not a random market sample. The displayed universe includes ETFs, Bitcoin and AGPXX. Most prices are November 11; each row preserves its actual date. Signal dates are not used as price dates. Monthly Standard settings and the current monthly verdict are compared; completed and forming AURYN readings are also recorded separately. The site's guide inconsistently calls screener readings confirmed, while screener help and ticker examples identify the current forming month; this distinction is preserved in observations.

## Specific findings

- AA: reference 3X; AURYN forming P4 at the same $41.04 close.
- NBIS, checked separately from the alphabetic 1,000: reference 2X; AURYN forming P1 at the same $154.69 close.
- APP analyst low/consensus/high: $345 / $454.28 / $610, with 30 analysts and a $404.77 close.
- NBIS analyst low/consensus/high: $84 / $278.05 / $410, with 20 analysts.
- These analyst targets are third-party consensus data, separate from a cash-flow intrinsic valuation and separate from technical Pace zones.
- Pro projected price ranges and detailed financial tabs were locked in the available Standard account. Placeholder zeros were not used as observations.
- AGPXX has no matching Twelve Data history in this run. BLOK and BTCUSD have close-price differences and remain visible in the result.

## Code corrections

The cash-flow valuation no longer changes reported negative growth into zero. Contraction now lowers bear/base/bull values; growth at or below -100% is rejected. Positive growth remains capped at 10%, and the disclosed growth-fade, dilution and discount assumptions remain explicit. Two regressions reproduced the defect before the correction and pass afterward.

The earlier qualified cash-flow selection and rejected-revenue fallback corrections are included. No ticker-specific verdict overrides or fitted-to-this-snapshot model changes were added. The current Pace model is a trained approximation with separate legacy trim rules, not DCA Optimizer's proprietary formula. Additional Twelve Data or EODHD market data does not disclose that formula. Guaranteed equivalence would require an authorized signal feed or a disclosed/licensed calculation specification, followed by dated replay checks.

## Validation and reproduction

`npm run verify` passed lint, formatting, all **1,361** tests, type checking and the production build. `npm run test:api` also passed its controlled fixtures. These software checks are separate from reference agreement. No production deployment or database mutation was performed.

Extract the source ZIP and the separate evidence ZIP. With Node 24, from the source AURYN directory:

```sh
npm ci
npm run verify
npm run test:api
node --experimental-strip-types scripts/replay-reference-snapshot.mjs /absolute/path/auryn-reference /absolute/path/result.json --require-exact
```

The last command writes all rows and returns a nonzero exit code unless every requested row has a matching close and matching verdict. Input and model SHA-256 values are recorded. Do not interpret the passing software checks as approval to promote this source as a 100%-equivalent Pace release.

The source archive omits dependencies, generated build output and private environment files. Existing deployment configuration is required; no new migration is introduced by these corrections.
