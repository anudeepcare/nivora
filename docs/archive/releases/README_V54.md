# NIVORA V54 — Canonical Intelligence Engine

V54 is a trust/architecture release. It reduces the number of independent scoring brains and makes the stock thesis, valuation, timing, Street evidence, and owner position logic explicit.

## Core changes

- `buildInvestorDecision()` is the canonical thesis/decision engine.
- `buildNivoraIntelligence()` is now a compatibility adapter that consumes the canonical engine instead of calculating a second thesis.
- Technicals affect timing/execution, not the fundamental thesis.
- Wall Street price targets are displayed as external context and are no longer treated as NIVORA fair value.
- Analyst rating *level* is intentionally low weight; change/direction is more useful than the structurally bullish raw consensus.
- Archetype-specific preliminary valuation paths now distinguish financials, biotech, miners/cyclicals, hypergrowth, compounders/general, and crypto.
- Data completeness is labeled honestly. Statistical model confidence remains `Uncalibrated` until enough forward outcomes exist.
- Hard risk vetoes can block aggressive long recommendations.
- Owner cost basis changes position management only; it never changes the company thesis.
- Entry UX is tiered: starter support, accumulation support, strong-accumulate confluence, do-not-chase/resistance, and technical risk check. Broad support no longer collapses to “No tight confluence zone.”
- 3M/6M/1Y/2Y/3Y use different weights and purposes.
- Added `/api/calibration` read path over the existing decision/outcome ledger.
- Added engine contract tests.

## Important limitations

V54 is not a validated autonomous trading system. Several archetype-specific valuation engines still require deeper data (e.g. residual income for banks, rNPV for biotech, NAV for miners). When those inputs are unavailable, NIVORA intentionally returns `Unclear` rather than fabricating fair value.

The calibration endpoint begins becoming useful only after enough genuinely forward observations have matured. Until then, the UI must not present a probability-of-success confidence number.

## Verification performed in build environment

- Python investment scanner compiles.
- All TypeScript/TSX files pass parser/transpile syntax checks.
- `node --test tests/v54-engine-contract.test.mjs` passes 5/5 contract tests.
- Full `next build` could not be run because `node_modules` was not available in the supplied archive and package installation did not complete within the build environment.

## Security

Release packages must not include `.env.local`, `.git`, `.next`, caches, or local build artifacts. If a previous project ZIP containing live credentials was shared externally, rotate those credentials before further distribution.
