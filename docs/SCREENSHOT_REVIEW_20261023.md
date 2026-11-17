# Screenshot-driven research refinement

## Inspected references

All thirteen supplied AURYN screenshots from 10:39:53 PM through 10:44:46 PM were inspected, plus the two Versys reference screenshots at 10:50:44 PM and 10:51:59 PM. Originals were read directly from the supplied workspace and were not altered or added to the source package.

## Implemented changes

- Business now opens with reported durability metrics and three charts (revenue, cash after capex and operating margin), then evidence supporting/challenging the case. The long company description is collapsed and placed below the business evidence.
- Financials has a chart explorer across the existing 36-metric catalogue: grouped metric selection, annual/quarterly/TTM using the same parent period controls, 3/5/10-year or available-history range, bar/line/area views, dated observations and optional values table. Bank-inappropriate fields remain excluded. Missing data is not drawn as zero, percentage changes use percentage points, and CAGR is withheld for ratios, percentages, incomplete annual sequences or non-positive endpoints. No additional provider requests are needed. Multi-company chart overlays are not included.
- Added CCI20, Williams %R14, MFI14, ten-session efficiency, prior 20/55-session channels, and 50/200-week linearly weighted averages. Weekly averages require consecutive completed weeks. Definitions accompany each metric. These use existing OHLCV; they do not create trade probabilities.
- A single classification check now protects the header, Business, sector benchmark and peer-discovery endpoint against finance metadata contradicting a known infrastructure business. IREN's old Financial Services / Capital Markets profile no longer causes an XLF suggestion or finance-peer query. No replacement industry is invented and the stored provider data is not overwritten.
- Removed the desktop-only legacy CSS variables that set white text inside the now-white Advanced heading. The Advanced content stylesheet owns its theme colours.
- Reduced oversized tinted consensus panels to compact inline metrics; moved Value methods below the primary result and kept unsupported optional workbenches closed initially. Large cash/working-capital values use compact formatting. The dark price chart remains intact.
- Overview's DCA card now includes each confirmed/forming settled close and its date, so it cannot be confused with the live quote. The rule is explicitly AURYN monthly v3.
- Home spacing and review rows were tightened. History studies and financial series memoization now depend on history/facts rather than recomputing solely because a live price changes. Actual device smoothness is not certified.

## DCA diagnosis: not equivalent, and not corrected by relabelling

The existing same-provider audited histories were replayed at 2026-10-22T23:00:00Z. This was not a new live provider pull. See verification/dca-threshold-diagnosis.json.

| Instrument / period | Settled close | AURYN result | Why |
| --- | ---: | ---: | --- |
| IREN September confirmed | 40.88 | 1x | 35.66% below prior monthly high, but 0.6868 spread units below fitted trend; 2x needs at least 0.70. |
| IREN October forming | 25.51 | 2x | 59.85% below the prior high, 1.2896 spread units below trend; 3x needs 1.35 and 4x needs 2.00. |
| APP September confirmed | 290.42999 | 3x | 59.58% drawdown and 1.7039 spread units below trend; 4x needs 2.00. |
| APP October forming | 264.28 | 3x | 63.22% drawdown and 1.5111 spread units below trend. |

Prior directly inspected DCA Optimizer observations were IREN 2x confirmed / 4x forming and APP 4x / 4x. Comparing confirmed 1x with forming 4x also mixes periods; even aligned periods remain different. Its public explanation calls its algorithm proprietary: https://dcaoptimizer.com/how-dca-works . No private rule set was obtained.

The difference is reproducible under AURYN's rules and does not depend on a live quote. This does not establish that those rules are good enough or competitive. Thresholds were not changed to force selected screenshot outcomes.

## Equal-budget evidence

See verification/dca-equal-budget-audit.json. The 14 previously audited histories were evaluated with 100 model units deposited monthly to both policies, carried unspent cash, no borrowing, next-observation execution and 10 bps costs. Thirteen histories were eligible; NBIS lacked the required post-warm-up execution history. The AURYN terminal value was higher in one, lower in three and effectively equal in nine. APP was approximately 1.00% lower, ASTS 11.21% lower, BE 9.13% lower and CIFR 0.27% higher. These are differences in simulated terminal values, not investment returns or forecasts.

The same selected histories, revised price adjustments, no dividends/interest/taxes and no independent validation universe limit this study. The later 30% chronological slice is a restart of the same dataset, not independent validation. A multiplier above 1x cannot spend more than previously retained cash in this equal-budget test. There is no demonstrated superiority over ordinary DCA and no performance comparison against the private competitor policy.

## Verification and remaining limits

408 automated unit/render/database tests, route type generation, TypeScript and production build passed. All 83 compiled API fixture checks passed. Logs: verification/screenshot-review-verify.log and screenshot-review-api.log. Raw licensed CSV histories are outside the source and excluded from distribution.

Current-code browser rendering and physical iPhone acceptance remain unavailable. These are implementation and automated-check results, not a claim of pixel parity or App Store readiness. PWA geometry was not changed. All-stock sector-specific valuations, full automatic peers, options/order flow, complete filings AI, subscriptions and the broader feature wish list are not finished. DCA equivalence and an investing edge are not established. No live database write, Git push, deployment, order or new subscription occurred.
