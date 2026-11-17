# Pace comparison and performance improvement

User approved investigating deeper-zone differences, removing redundant UI/CSS, improving loading, and adding concise decision-focused UX. Source delivery only; no deployment.

## Approach
Preserve the production policy while testing generic candidate thresholds on a deterministic development/holdout split of the saved audit. No ticker overrides, exclusion of mismatches, invented historical labels, or claim of independent accuracy. A same-day holdout does not establish later-date stability or investment performance. Production promotion requires validation beyond this one snapshot.

Consolidate only provably redundant CSS rules, retain cascade ordering of all surviving rules and test canonical equivalence. Defer secondary Research tab code with the existing Next dynamic-import mechanism. Keep existing data/access boundaries. Measure emitted assets; do not equate them to measured user latency.

Unique UX work must replace repetition: concise current assessment, changes, next condition and portfolio impact belong in existing flows rather than new text panels. Prioritize correctness and loading before expanding features.

## Verified results and delivery scope

The saved audit contains 589 usable stocks. The technical-feature experiment uses 407 development symbols and 182 reserved symbols, grouping known paired share classes. Reserved results improved from 74.2% to 86.8% exact category agreement, and from 40.6% to 75.4% agreement within reference 2X–4X categories. Development agreement of 99.3% is not a validation result. Reserved symbols have been reused during exploration; these results are exploratory, not an untouched final test. No later-date validation was completed. Production Pace remains unchanged.

The report records per-symbol predictions, feature definitions, candidate selection and limitations. Reproduce with Python, numpy and scikit-learn using scripts/evaluate-pace-features.py AUDIT_DIRECTORY --output REPORT.json. AUDIT_DIRECTORY is the extracted original AURYN-expanded-comparison-audit.zip containing comparison.json and raw price histories. Targets and analyst estimates were not audited across this universe.

## UI and valuation changes

Removed the duplicated Overview assessment panel. Pace and the chart lead again, with the current zone, next conditional level and previous month distinctly identified. Rapid-growth companies are excluded from the conservative mature-business cash-flow headline model using an explicit 20% revenue-growth applicability threshold. This is a suitability heuristic, not a calibrated fair-value estimate. Compatible earnings scenarios can still be used; missing compatible inputs do not generate invented targets. Scenario colors follow actual upside/downside, including negative higher-model values. APP replacement target values have not been verified against a complete live financial snapshot.

Twelve secondary Research components now load on demand. Removed 31 exact duplicate CSS rules while preserving cascade order: 2,759 raw bytes saved. Initial catch-all route first-load JS remained 253 kB; total emitted JS increased with chunk splitting. No measured latency improvement is claimed.

## Validation

1,213 tests passed; lint, formatting, typecheck and production build passed. Pace-first layout checks passed at 320, 390, 768 and 1440 px in light and dark themes. Fixture browser checks verify layout and interactions, not live provider data. Source delivery only: no deployment, database migration or scheduler activation.
