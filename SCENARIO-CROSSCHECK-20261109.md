# Scenario cross-check, portfolio range, Home session move and Pace ladder — 9 November 2026

Source ZIP only. Nothing was pushed, deployed or migrated. Baseline: preprod d39d384.

## Why
Reviewed on the signed-in preprod preview (IREN, Portfolio, Home):
- IREN Valuation showed three "Not calculated" cards while Overview showed a 3-month historical range and a +199% analyst target, with nothing relating them.
- The Pace ladder read P4 "Deep accumulation" at $24.96, above the $21.41 price, while the line above it said "Next checkpoint P4 near $20.34".
- Portfolio ($951K, 28 holdings) had no portfolio-level bear/base/bull and no view of which holdings drive the swings.
- Home had no summary of how the user's own holdings moved.

## Added
1. **Scenario cross-check** (`lib/scenario-lenses.ts`, `components/ScenarioLenses.tsx`) on Research Overview and Valuation. Each qualifying method is its own bear/base/bull row on one price axis: selected AURYN model, analyst low/consensus/high, the stock's own 1-year and 3-month historical percentiles, and the revenue forecast spread when no model qualifies. Shows method agreement, bull/bear gaps and where the price sits. Rows are never averaged and no probability is assigned. On Overview it appears only when two or more methods qualify.
2. **One-year historical range** (`priceRiskScenarios(r, { horizon: 252 })`). Opt-in, needs 756 settled sessions. The default 63/20-session result is unchanged. Output now reports the non-overlapping period count.
3. **Portfolio range** (`lib/portfolio-range.ts`, `components/PortfolioRange.tsx`) under Portfolio trend. Reprices today's quantities on shared dates and applies the basket's own 10th/50th/90th percentile return, so co-movement is included. Adds annualised swing size, largest fall in the window, and weight versus share-of-movement per holding. A recently listed holding is dropped and named instead of erasing the shared history.
4. **Holdings latest session** (`lib/portfolio-day.ts`, `components/PortfolioDay.tsx`) on Home: value, dollar and percent session move, the three holdings that helped and hurt most, with coverage stated.
5. **Pace ladder prices** (`lib/pace-ladder.ts`): deeper stages show their nearest band below the reference (≤), shallower stages their nearest band above (≥). Presentation only; bands, thresholds and the classifier are untouched.

Formulas are recorded in the owner handbook addendum.

## Market-wide hardening (second pass)
The first pass was checked against too few names. This pass makes the new pieces hold for any instrument:
- **Recent listings** (80–251 sessions, e.g. CBRS, FPS on the watchlist) now get a labelled 1-month historical row instead of nothing. Under 80 sessions no historical row is invented.
- **Agreement compares like with like:** only the model, analyst targets and the 1-year historical row. Shorter rows are context, so a 3-month median is never read as "disagreeing" with a 12-month target.
- **Sub-dollar and very large prices** use `priceAmount`, so $0.0712 and $0.0745 no longer both print as $0.07 in the cross-check and the Pace ladder.
- **Unadjusted splits and bad ticks** are flagged (one-session fall ≥45% or rise ≥80%), shown as supplied and not corrected. The real APP +46% earnings day is correctly not flagged.
- **`tests/market-robustness.test.mjs`**: 384 seeded synthetic instruments in 24 market shapes and 120 random baskets through every new engine and view, asserting ordering, finiteness, reproducibility and clean rendering.
- **`scripts/audit-scenario-coverage.mjs`**: the same consistency checks on real provider histories in the existing audit raw-folder format (`universe.json` + `raw/<SYMBOL>.json`), with `--ladder` for the Pace ladder. Run it on the 500-ticker folder to get a real-market coverage report.

## Accuracy pass (third pass)
Question asked: how accurate are these cases? Answer measured, not assumed.
- **Past check** (`lib/scenario-calibration.ts`): every historical row is rebuilt at earlier dates from prices known then and scored against what followed, one non-overlapping period at a time. The row shows "held 24 of 36 (67%)" against the 80% a 10th–90th range is designed for, or "too few to judge" under 8 scored ranges. No look-ahead (tested).
- **Finding:** raw historical percentiles run too narrow on the three real histories in the repo — about 64% at one month and 61% at three months instead of 80%. Past drift and stale volatility are the causes.
- **Volatility-adjusted range:** new row with drift removed and volatility rescaled to current conditions. Same check: about 70% at one month on the real histories, 79% including the synthetic market. Better, still short of 80% on real data, and the row says so.
- Seven candidate methods were compared before choosing this one; the comparison is reproducible from the functions in the calibration module.

## Not changed
Pace thresholds and classifier, the decision engine, `researchOutlook`, revenue sensitivity, analyst target handling, the existing historical fallback card, schema, API routes.

## Verification
- Full suite: 1,345 passed, 0 failed (1,311 before this work; 34 new).
- Audit script run on the three real histories in the repo (AVGO, APP, ALAB): 3 covered, 0 failed, ladders consistent.
- ESLint, Prettier check, TypeScript and `next build` passed.
- Rendered locally from demo fixtures at desktop and 390px: cross-check, Pace ladder, portfolio range, Home strip. No page errors.

## Not verified
- Real-market breadth: only three real price histories exist in this source tree. The synthetic universe proves the code does not break or mislabel; it cannot prove behaviour on every live ticker. The audit script is the way to measure that with provider data.
- Not run against live provider data or the signed-in account; the IREN ladder case is reproduced by a unit test built from the live figures, not from the live payload.
- No physical-device check. Dark theme was not screenshotted for the new sections.
- The Portfolio range uses the existing 6-month chart reads (about 126 sessions, roughly six non-overlapping months). A longer window would need a longer chart range request.

## Open data question, not changed
IREN statement values display as AUD (A$707M revenue, A$5.9B cash) because the provider row carries `currency_symbol` AUD. IREN has reported in USD since FY2025, so these labels need checking against the filing before anyone relies on them. No value or label was altered here.
