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

## Headline cases never blank or pinned to price (fourth pass)
Owner report: bear/base/bull missing or wrong for HIMS, IREN, CIFR, WYFI, NBIS, FPS, CBRS. Cause in code: without positive earnings the cards were either "Not calculated" or a price-anchored sensitivity whose base equals today's price.
`lib/scenario-headline.ts` now supplies the headline cards on Overview and Valuation when no earnings or cash-flow model qualifies, in this order, always naming the source:
1. Supplied analyst low / consensus / high.
2. Analyst consensus as base, with bear and bull scaled by the lowest and highest analyst revenue forecasts for the same fiscal year (fundamentals, stated assumption of an unchanged multiple).
3. The stock's own historical range, labelled as such.
Qualifying earnings and cash-flow models are unchanged and still lead. Not yet seen on live data for the named tickers.

## The case in plain words (fifth pass)
Owner feedback: Overview is not understandable and looks driven by technicals alone. `lib/stock-pillars.ts` and `components/StockPillars.tsx` add a panel at the top of Overview with six questions, each with a plain answer and its reason: Is the business growing? Does it make money? Can it pay for its plans? Is the price reasonable? Is now a sensible time to add? How bumpy is the ride? Inputs are the existing decision, research brief and scenario headline. Reading thresholds are in `PILLAR_LIMITS`. The answers are not combined into a score and do not change the decision engine or Pace. Missing evidence reads "Not measured", never as a negative. Market and macro context is not included: the research payload carries no benchmark or macro data.

## One call with its cases, and a sell-side audit (sixth pass)
- The plain-words panel now shows bear / base / bull beside the call, with the named source and whether today's price sits inside, above or below the range.
- **Sell-side audit of `assessDecision` (no rule changed):** Sell triggers only on insolvency. Reduce triggers only on funding distress or business deterioration. Price never triggers either: a held stock at P0, or priced above its bull case, reads Hold. A business that fails the support screen reads Review indefinitely unless it reaches distress. Whether to add a valuation-based Reduce is an owner decision and needs a backtest first.

## One set of cases, runaway revenue model withheld (seventh pass)
Owner screenshots of live CIFR showed two different bear/base/bull sets on one page ($18.80/$22.95/$28.45 in the plain-words panel, $46.97/$83.58/$142.26 in AURYN valuation at 43–65x EV/revenue against a $6.81 price), and APP with a bear case above the price.
- `lib/scenario-cases.ts` is now the single source for cases; the plain-words panel and the valuation cards follow the same order (qualifying model, then named analyst or historical headline). A test asserts they agree for every market shape.
- A revenue-multiple model is withheld when its base multiple is above 20x or its base case is above three times the price (`REVENUE_MODEL_LIMITS`). The underlying engine applies the provider's trailing EV/revenue to a much larger forecast revenue; that calculation is not changed, only no longer shown as a case.
- The bear-above-price result came from scaling the consensus by revenue-forecast spread; that method was removed in the previous pass.
- Pace first on Overview; plain-words panel directly under Pace and the chart.

## Sell-side prompts (eighth pass)
The plain-words panel now shows a Trim watch when the price is above a model or analyst bull case, and a Thesis watch when growth, profitability and funding all read Careful. Both are prompts beside the call. The decision engine and its Sell / Reduce rules are unchanged, and neither prompt has been backtested.

## Overview shows the cases once (ninth pass)
Owner request: bear/base/bull appeared twice on Overview. The valuation cards are removed from Overview; the cases appear once, beside the call in the plain-words panel, from the same shared source. The method comparison is collapsed behind one disclosure. Valuation and Targets tabs keep the full cards. The test that required the cards on Overview was updated to assert the new rule.

## Broad-market study and what it changed (tenth pass)
See `verification/market-study-20261110/REPORT.md`. 1,305 real stocks, ten years.
- Volatility-adjusted ranges held 78% at one and three months and 70% at one year; raw percentiles 74%, 71% and 59%. Headline bear/bull that come from price history now use the volatility-adjusted range, and the text states the measured hit rate.
- Point-in-time business-check test (34,297 stock-months, 2022 to 2025): the check separated outcomes strongly (about 60% positive years when it passed, about 37% when it failed). Deeper Pace zones did not improve outcomes even for passing companies (P1 63% positive, P4 46%). The earlier S&P-membership split was hindsight-biased and is discarded. The timing answer in the plain-words panel now reads Partly for a pullback in a passing business and Careful in a failing one, with these figures.
- Automated crawl of 68 page views on demo data found one markup error on the Labs page and nothing else.
- No Pace threshold, classifier or decision rule was changed.

## Measured record for each stock (eleventh pass)
Design comparison on the point-in-time data (REPORT.md): business check first, trend second; deeper falls were worse, not better. The plain-words panel now shows the measured one-year record of stocks in the same state as the one on screen (business check × above/below 200-day average, with deep-fall and near-high cases called out), the timing answer is driven by that record, and the sell-side prompts follow it: Thesis watch when the business check fails; a stretched price in a sound business is a size check, not a sell prompt. The Pace classifier, thresholds and decision engine are still unchanged; their P2–P4 sizing is not supported by this evidence and needs an owner decision.

## Evidence rules in the call, and calibrated ranges (twelfth pass)
Owner instruction: Pace, the cases and the sell side must be better, not relabelled.
- **Decision engine (`assessDecision`), three added rules, active only when the measured-record state is available:** a business that is not supported and is losing money and burning cash reads Reduce (holder) or Avoid; a supported, passing business at P1 with the price above its 200-day average, not expensive and not overbought, reads Add / Buy at the planned pace; a supported business at P2–P4 that is 30% or more below its one-year high reads Hold / Wait until the fall steadies. All other rules, the Pace classifier and its thresholds are unchanged. Two existing tests whose fixtures are deep falls were updated to the new call.
- **Ranges:** volatility-adjusted ranges are widened by factors fitted on half of the study and verified on the other half, where they held 80.2%, 79.7% and 80.4% at one month, three months and one year.
- These rules come from 2022–2025 data on companies listed today. They are evidence-based, not proven for other periods.

## Not changed
Pace thresholds and classifier, the decision engine, `researchOutlook`, revenue sensitivity, analyst target handling, the existing historical fallback card, schema, API routes.

## Verification
- Full suite: 1349 passed, 0 failed (1,311 before this work).
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
