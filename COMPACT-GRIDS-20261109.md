# Compact Research grids — November 9, 2026

Inspected both newly supplied screenshot images before editing. The first shows the full company metrics and four category cards. The second shows three large historical diagrams and an oversized disclosure area.

## Changes
- Historical cases now use a compact three-column desktop grid and compact aligned rows below 600px. Removed redundant per-case diagrams, not data. Retained all three values, percentile labels, percentage comparisons, a visible dated reference and complete methodology disclosure.
- Historical disclosure keeps a visible “not forecasts or fair value” label. The full limitations remain accessible, including unvalidated predictive accuracy and the fact that percentiles are not future probabilities.
- Qualified bear/base/bull model cases use a compact open grid, smaller headings and tighter spacing, without case tiles or an outer panel. Their shared price rail, assumptions and fiscal-year selection remain.
- Removed background cards, rounded surfaces, shadows and panel padding from the four Research metric categories. All values, help, provenance and navigation remain. The upper metric grid remains intact.

## Calculation review
No numerical calculation changed. The historical calculation file remains identical to production main d6b51bd222f6f3c9d88748398dd8b176b3d69ed0. Historical percentiles describe past price variability, not intrinsic value or a future expected return. Previously verified available sources do not supply a complete analyst low/high range or a funded company forecast for every ticker. Inventing a substitute would not make the result better. Existing qualified financial models continue to take precedence over the historical fallback; analyst consensus stays separate.

No new provider calls, purchases, paid sources, remote code changes or deployments. No claim of more accurate estimates.

## Verification
The existing rendering regressions were updated to assert that all three historical values and the reference survive without the removed diagrams. They cover all-above, all-below and equal-to-reference cases. Existing integration tests verify both Research grids and navigation remain present.

Actual candidate browser/mobile visual verification remains blocked by the browser/local-server connection barrier documented in OVERVIEW-REFINEMENT-20261109.md. Responsive rules and server-rendered output were checked; this is not a claim of real browser visual acceptance. User screenshots show the preceding version, not this candidate.

Final automated checks: 1,311 tests passed, zero failures; lint and formatting passed; production build passed including type validation.
