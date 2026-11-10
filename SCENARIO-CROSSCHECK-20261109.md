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

## Not changed
Pace thresholds and classifier, the decision engine, `researchOutlook`, revenue sensitivity, analyst target handling, the existing historical fallback card, schema, API routes.

## Verification
- Full suite: 1,330 passed, 0 failed (1,311 before; 19 new across scenario lenses, Pace ladder, portfolio range, portfolio day).
- ESLint, Prettier check, TypeScript and `next build` passed.
- Rendered locally from demo fixtures at desktop and 390px: cross-check, Pace ladder, portfolio range, Home strip. No page errors.

## Not verified
- Not run against live provider data or the signed-in account; the IREN ladder case is reproduced by a unit test built from the live figures, not from the live payload.
- No physical-device check. Dark theme was not screenshotted for the new sections.
- The Portfolio range uses the existing 6-month chart reads (about 126 sessions, roughly six non-overlapping months). A longer window would need a longer chart range request.

## Open data question, not changed
IREN statement values display as AUD (A$707M revenue, A$5.9B cash) because the provider row carries `currency_symbol` AUD. IREN has reported in USD since FY2025, so these labels need checking against the filing before anyone relies on them. No value or label was altered here.
