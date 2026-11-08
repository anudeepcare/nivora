# Reliability and clarity release

Authorized by the user's approval to build the discussed consistency release.

## Design
Keep the existing Next/React application and AURYN theme. Centralize current
Pace eligibility and selected valuation presentation rather than introduce a
second scoring system. Historical monthly calculations remain unchanged for
audit/backtests. No deployment or production database mutation.

Current price context is the latest eligible settled daily observation, not a
live tick. Historical P4 cannot authorize additions after the current zone has
fallen to P1. Developing deeper zones do not increase contribution eligibility
beyond the last closing zone. Missing current history blocks Pace additions.

Overview scenario cards use the decision engine's selected valuation. Present
cash-flow values as present model values, earnings sensitivities with their
future fiscal horizon, and historical price risk separately. The default
valuation detail repeats the same selected model; exploratory models remain
explicitly separate. Market-multiple sensitivities are labeled as such.

## Implementation and acceptance
1. Add tested current-zone/eligible-plan selectors and use them across shared
   decisions, labels and contribution sizing.
2. Make current Pace the main card. Move prior-month closing evidence into a
   secondary disclosure; explain changes and provisional status.
3. Reuse the selected decision valuation for overview and default detail.
4. Add a compact assessment with supporting reasons, main concern and the next
   condition; use scoped responsive theme styles.
5. Run calculation regressions, type checking, lint and production build;
   verify a rendered mobile/desktop view where the environment permits it.
6. Deliver source ZIP, exact checks and remaining limitations.

Sector-specific new financial models, independently validated performance,
99% competitor agreement and full legacy CSS removal are not claimed by this
release. They require separate evidence and validation.
