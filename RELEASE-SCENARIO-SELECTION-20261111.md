# Scenario selection correction — 11 November 2026

This source release fixes two reproduced selection defects in `lib/scenario-cases.ts`.

1. A cash-flow valuation already qualified by the decision engine now leads the shared Bear/Base/Bull display. Previously an available earnings or revenue outlook could replace it, so the headline and decision valuation used different models.
2. Rejecting an extreme revenue outlook now allows a valid decision valuation to supply the cases. Previously the fallback only ran when the outlook was unavailable, not when it was available but rejected.
3. Decision valuation bounds must be finite, positive and ordered before display. Invalid bounds cannot displace an eligible outlook.

All consumers of the shared selector receive the correction. No new valuation formulas, growth estimates, moat scores, threshold tuning, database changes or deployment were introduced. Existing historical-risk and analyst fallback behavior is preserved.

## Reproduction

`tests/scenario-selection-regression.test.mjs` runs the real selector and outlook implementation. Against the original uploaded selector, the cash-flow priority and rejected-revenue fallback tests fail. With this correction they pass. Additional checks cover malformed bounds and invalid observation dates.

## Validation

Completed successfully: `npm run verify` (lint, formatting, 1,359 tests, TypeScript and production build) and `npm run test:api` (controlled fixtures). The build emitted the existing Next.js ESLint-plugin detection warning; it exited successfully.

See `verification/scenario-selection-20261111/` for the original failing regressions, final verification log, and controlled API fixture checks. Run with Node 24.x:

```sh
npm ci
npm run verify
npm run test:api
```

## Deployment

Extract the ZIP and use its `AURYN` directory as the application root. Install dependencies with `npm ci`; build with `npm run build`. Use the existing environment configuration. This correction does not require a database migration. Build output and node_modules are deliberately excluded from the source package.

## Accuracy evidence

This release corrects model selection; it does not establish predictive accuracy. The supplied historical comparison artifact contains 563 matches among 589 rows, including 159 of 182 reserved rows and 53 of 69 deeper-category rows. Those are prior saved comparisons, not newly measured live results or stock-price forecast accuracy. No parity improvement is claimed for this selector correction.
