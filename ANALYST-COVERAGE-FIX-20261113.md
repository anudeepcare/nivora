# Analyst target coverage correction

This is a source-only correction to the latest recovered application. It does not deploy anything, change provider plans or budgets, or claim that 1,000 live target triples match another service.

## Current observations

The authenticated application screens were inspected on November 13, 2026. Both examples use the November 12 settled close, not the changing intraday headline price.

| Stock | Settled close | AURYN consensus | Reference consensus | AURYN low/high |
| --- | ---: | ---: | ---: | --- |
| IREN | $19.48 | $56.69 | $56.69 | Not supplied |
| NBIS | $128.64 | $278.05 | $271.20 | Not supplied |

Reference low/high observations were IREN $23/$139 and NBIS $84/$410. AURYN's reported recommendation totals are not unique target-analyst counts and are not compared as such. Individual target revision dates were not available, so matching settled-close dates do not establish matching analyst publication vintages.

IREN's mean agrees. NBIS differs by $6.85. Neither supplies an AURYN full analyst triple. The formulas reproduce the reference percentages when given the same target inputs and settled close; that arithmetic replay is not independent provider validation.

## Source trace and actual changes

The active source path is `research` → `fundamentals` → `eodFundamentals` → `normalizeEodFundamentals` → `consensusOutlook` → the shared analyst target views. It reads EODHD `AnalystRatings.TargetPrice`. Low/high only exist if the source actually supplies `TargetPriceLow` and `TargetPriceHigh`. There is no active independent low/high provider in this path.

Changes in this package:

- Recover a positive consensus from the documented `Highlights.WallStreetTargetPrice` field when the AnalystRatings target is missing or invalid. Prefer a valid AnalystRatings target when both exist.
- Keep the selected field and listing currency with the normalized observation. Do not graft AnalystRatings bounds onto a different consensus field.
- Retain valid ranges whose low, consensus and high are equal. Reject target-currency conflicts.
- Label the actual denominator as settled close or quote. Show when a full analyst range is missing or invalid instead of silently suggesting the mean is a complete triple.
- Name the provider and label `General.UpdatedAt` as a dataset update date, never an individual target revision date or a retrieval time.
- Remove the contradictory unconditional claim that target ranges are unavailable even when a valid range is present.
- Separate cohort coverage, available consensus comparisons and complete-triple agreement in the audit tooling. Missing observations cannot pass or silently disappear from the requested cohort.

No ticker-specific target overrides, borrowed bounds, new import screen or extra paid-provider calls were added. Existing qualifying AURYN models remain separately labeled and the full Research layout is retained.

## Remaining data blocker

These corrections do not create the missing IREN/NBIS bounds or replace NBIS's provider mean with a reference-screen number. EODHD's whole-record update date does not identify the target revision date; the exact upstream cause of the NBIS discrepancy is not established.

Twelve Data's official `price_target` endpoint supplies low/average/high, but currently costs 75 credits per symbol. The existing AURYN request budget rejects costs above 55. The connected quota response reported a plan limit of zero, which does not establish a safe usable allowance. A single earlier AAPL probe succeeded, so this is not a claim that the account is categorically denied. No budget was raised and no additional bulk calls were made. A 1,000-symbol run would nominally consume 75,000 endpoint credits and requires verified entitlement and allowance before it can be run.

The reference site's current terms prohibit systematic/bulk recording and automated extraction. Its inspected screener did not expose analyst-target columns or an export. No new bulk reference extraction was performed. The 1,000-row audit reports the observations actually present and the remaining missing evidence; it is not a completed 1,000-stock live comparison.

## Sources

- [EODHD fundamentals documentation](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds)
- [Twelve Data price-target documentation](https://twelvedata.com/docs/analysis/price-target)
- [Reference service terms, section 7](https://dcaoptimizer.com/terms)

## Verification

The six new regression tests failed against the original source and passed after the correction. Final combined test/build evidence is recorded under `verification/analyst-1000-20261113`. These are source and fixture checks, not a claim that the changed code is deployed or that fresh paid-provider data was fetched.
