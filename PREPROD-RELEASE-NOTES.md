# Research clarity and visual metrics — November 3, 2026

Based on current preprod commit 9609c95. This is a partial UX update, not the completed enterprise release.

Included in this update:

- Research: plain-language headline without repeated P code, compact evidence disclosure, smaller responsive decision layout and quieter Pace panel.
- Home: portfolio summary before the earnings panel; expandable milestones instead of a second full event list.
- Public site: revised product thesis, named price zones, shorter hero and more compact workflow cards. Shared account and education layout refinements.
- Gamma: ten largest strike exposures, sorted by strike, with tappable explanations; sign legend and sticky heatmap headers. Existing provider inputs and sign conventions remain unchanged.
- Fibonacci: retracement percentages and distance from the latest completed close, with dated anchors retained.

No financial thresholds, valuation formulas, or investment recommendations were changed. Existing Pace clarity fixes from 9609c95 are retained.

Verification: 865 automated tests passed; TypeScript passed; clean production build passed. An initial build failed removing stale generated output; rebuilding from a clean output directory succeeded. Browser installation failed with a truncated download, so this update has not received rendered mobile or PWA acceptance. Automated tests are not evidence of investment performance.

Outstanding: complete page-by-page UX overhaul, mobile/PWA visual acceptance, production/main comparison, 400-ticker matched-data audit, valuation calibration and historical investment validation. Collected competitor observations are not validated AURYN outcomes.

Use the existing preprod branch. Preserve local work before importing. Do not copy .git, .env or dependency directories from another installation. Run npm ci and npm run verify before committing. Review git diff before pushing. Do not promote to production on the basis of this preview.
