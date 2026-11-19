# Analyst targets and Pace follow-up

## User-facing change
The active IntegratedResearch Overview now uses the existing AnalystTargets component instead of the AURYN model scenario cards. Pace remains first. Analyst low, consensus and high values are supplied data, not renamed model scenarios. Existing consensus freshness, currency and ordering checks remain in force; no usable target means no target panel. Detailed AURYN models remain available in Valuation. This does not independently validate a provider's estimates or promise that their values match DCA Optimizer. No fabricated analyst counts or horizons were added.

## Expanded comparison
Two additional generic model families were evaluated using the same development cross-validation selection. The selected depth-four boosting model achieved 159/182 exact matches (87.4%) and 53/69 deeper-zone matches (76.8%). Reference category matches: 1X 106/113; 2X 25/29; 3X 8/20; 4X 20/20. The small 4X sample is not evidence of universal perfect agreement. Five 1X stocks remain classified as trim by preserved production extension handling.

The previous candidate achieved 158/182 and 52/69. This is a modest one-stock improvement, not a breakthrough. Twenty-three mismatches are exported to reserved-mismatches.csv. The next research priority is the 3X boundary and extension handling, using fresh dated reference labels. Repeated use of this snapshot prevents calling it an untouched validation set. Production Pace was not changed. No temporal validation or independent investment-return accuracy is claimed.

## Reproduction
Run scripts/evaluate-pace-features.py against the extracted AURYN-expanded-comparison-audit.zip with --output pointing to a JSON report. Requires numpy and scikit-learn. New expanded results are saved alongside the previous evaluation; the script now includes the two additional candidate families.

## Verification
The updated UI regression test renders real analyst-target logic, verifies supplied low/consensus/high and checks that missing coverage does not substitute a cash-flow value. Pace layout passed eight viewport/theme cases with no overflow or page errors. All 1,213 tests, typecheck, lint and formatting passed. Source only, no deployment.
