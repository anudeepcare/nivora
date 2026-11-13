# Portfolio comparison and target freshness

This root-level source bundle combines the latest recovered application and analyst-coverage correction with the portfolio refinement and the guarded fundamentals freshness fix. Extract it and use the directory containing `package.json`; there is no extra enclosing project folder.

## Included changes

- Portfolio: teal holdings and a dashed violet market line; SPY/QQQ selection, 1M/3M/6M windows, percentage/value views, accessible date inspection and an underlying data table. Matching actual dates are used for comparisons. Today's holdings repriced historically are explicitly distinguished from actual account returns.
- Portfolio layout: a full-width range row retains Bear/Base/Bull, useful exposure panels and the full holdings table. Missing comparison or range data is explained without invented values. The benchmark-switch loading race is covered by a regression test.
- Analyst data: the previous coverage/source corrections remain intact. With the existing shared market-data guard enabled, permitted fundamentals refreshes bypass Next's extra stale-response cache instead of republishing an old response for another application-cache period. Existing provider budgets and configured cache periods are unchanged.
- All existing Research tabs, metric grids, source files, Pace implementation and separately labeled scenario models are preserved.

Detailed notes: [Portfolio refinement](PORTFOLIO-REFINEMENT-20261113.md), [Target freshness](TARGET-FRESHNESS-FIX-20261113.md), and [Analyst coverage](ANALYST-COVERAGE-FIX-20261113.md).

## Limits that remain

Full external analyst-target matching is **not verified**. The saved November 13 IREN consensus matches; NBIS differs by $6.85, or 2.53% of the reference target. Both AURYN low/high ranges remain missing. The 1,000-symbol evidence audit is incomplete, with 998 missing pairs and two partial pairs. No tolerance, inferred bounds or screen-value overrides were added to make those examples pass.

The portfolio's browser visual verification remains incomplete: this executor could not run the local Chromium preview. Mobile/desktop/dark rendering and real SPY/QQQ data availability are not claimed as verified. Missing benchmark data remains a supported state. Inspect the UI before production release; the included local browser regression script uses synthetic fixtures and blocks external browser requests.

No live provider data was fetched for these source changes. No purchase, new paid service, budget increase, push, deployment, database migration or scheduled job was performed.

## Verification

Integrated `npm run verify` passed lint, formatting, all 1,412 tests, typecheck and the production build. `npm run test:api` passed its compiled API fixture checks and checked 56 production traces for fixture isolation.

Integrated verification results are recorded in `verification/integrated-release-20261113/summary.json`, with the complete command logs beside it. The source ZIP has a regenerated SHA-256 file manifest and a verified ZIP integrity check. These software checks do not establish investment performance, live-provider parity or visual acceptance.

Use Node 24.x. Run `npm ci`, `npm run verify`, and `npm run test:api` for local software checks. Keep existing deployment credentials outside this source archive.
