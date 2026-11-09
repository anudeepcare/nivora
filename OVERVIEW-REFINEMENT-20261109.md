# Overview refinement — November 9, 2026

All four supplied screenshots inspected as images. The third is the eight-cell company metric grid; all cells and their data/help remain. This update does not remove either Research grid or add panels.

## Changes
- Existing 30-second read now leads with the existing decision headline, business evidence, analyst context when available, and the first decision risk/change condition. Removes repeated quote movement and RSI from this summary only; their original views remain.
- Uses the existing decision object, avoiding a second decision calculation. Analyst target remains separate from fair value. Workspace retrieval time is no longer labelled evidence-through time.
- Lower company metrics retain all selected values, provenance and help with aligned label height, restrained row separators, compact gutters and two-column mobile layout. Both Research grids remain visible.
- Historical fallback explicitly states the midpoint is not an expected future price, predictive accuracy is unvalidated, and outcomes may exceed its range.

## Historical fallback assessment
The calculation file is identical to production main d6b51bd222f6f3c9d88748398dd8b176b3d69ed0. It uses overlapping historical returns (usually 63 sessions, 20 with shorter history) and applies their 10th/50th/90th percentiles to the selected reference. It is an empirical price-risk illustration, not fundamental valuation, an analyst range, or a probability forecast. No out-of-sample predictive accuracy was measured. It cannot establish growth prospects or moat. Longer history changes the sample and outputs.

Previous authentic provider-history replay covered IREN, HIMS, CIFR, NBIS, ASTS, APP and MSFT; see PRODUCTION-FALLBACK-20261109.md. That replay is not live UI validation. This refinement does not change any financial, scenario or contribution calculation.

## Verification and limits
- Full regression suite: 1,311 passed, zero failed.
- Lint, format check and production build passed (build includes type validation).
- Final concise-headline adjustment: six focused rendering tests and typecheck passed.
- Regression rendering checks preserve both metric grids, qualified valuation priority and historical fallback.
- All four user screenshots inspected; these show the previous deployed UI, not this candidate.
- Candidate browser validation attempted: available browser cannot reach local server (ERR_CONNECTION_REFUSED). Native Chromium launch produced no usable window. Therefore mobile/desktop actual visual validation remains outstanding; CSS and server-rendered tests are not a substitute.
- No authenticated production UI comparison in this turn. Prior production visit reached sign-in.
- No push, deployment, production edits, purchases or subscription changes.

This source is automated-check verified, not a claim of complete visual acceptance or a validated investment forecast.
