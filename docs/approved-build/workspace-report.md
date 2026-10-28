# Approved workspace implementation

Implemented the approved Home, Portfolio, Watchlist and Research landing compositions with live workspace data. All exported signatures remain zero-prop `Overview`, `Portfolio`, `Watchlist`, and `ResearchHome`.

## Owned files

- `components/ApprovedWorkspace.tsx`: approved wealth strips, briefing/insight/company/news cards, holdings table, allocation, sector groups, watchlist, search landing, contextual account and analysis dialogs.
- `components/ApprovedWorkspaceForms.tsx`: working position add/edit/remove dialog and per-company watchlist thesis editor.
- `components/ApprovedPortfolioChart.tsx`: supplied historical price chart, with explicit partial coverage and provenance.
- `lib/approved-workspace.ts`: tested USD aggregation and historical repricing models.
- `app/approved-workspace.css`: scoped runtime additions to the approved mockup CSS.
- `tests/approved-workspace.test.mjs`: ten meaningful model tests.

## Integration

1. Import `Overview`, `Portfolio`, `Watchlist`, and `ResearchHome` from `./ApprovedWorkspace` in Product.
2. Import `app/approved-workspace.css` after the approved mockup base CSS.
3. Keep the existing `useWorkspaceQuotes` export in `Workspace.tsx`; the approved components reuse it, including streaming prices, cached observations, refresh policy, and owner isolation.
4. Render these screens inside the approved `.approved-product` scope. Existing mockup class names supply the main layout, spacing, colors and typography.

The root's Product and CSS imports were already present when the final check ran. No existing Workspace, Session, Shell, Product or root stylesheet was edited by this task.

## Preserved behavior and data boundaries

- Uses `useProduct`, the existing portfolio/watchlist quote hook and account-balances endpoint. No live-route fixtures were added.
- Working add/edit/remove holding controls, USD cash entry, managed balance/margin editing, CSV import, refresh modes and filtering remain accessible.
- The full ledger and analysis drawer retains sortable ledger detail, allocation/return contribution charts, risk/calendar coverage, qualitative sector exposure, optional stress check and sector benchmarks. These components mount only when opened.
- Older unlabeled costs can still be explicitly confirmed as USD in the full ledger drawer; individual currency edits remain available.
- Watchlist remove uses the original mutation. Add company opens the existing functioning search. Alerts link to the existing alerts route. Notes use the documents API and preserve the company's other note fields when editing its thesis.
- Pace uses the production `researchAccumulation` policy on already supplied research, with the live clock on live routes. A genuine confirmed 4× is prominent; absent history is never replaced with a sample multiplier.
- Sector bubbles use supplied company sector labels/crypto identity and disclose unclassified positions. They do not imply measured correlations or invented thematic relationships.
- Missing/non-USD quotes remain excluded from USD totals, and non-USD or unknown cost bases never enter USD return calculations. Older usable USD observations remain visible with dates.
- There is no recorded portfolio NAV endpoint. The time chart explicitly reprices today's quantities using actual historical prices, using shared observation dates and excluding missing histories. It is labelled as price context, not historical account value or performance. It reuses cached research/chart history and performs at most ten new sequential history reads per attempt; the user can request further missing history. Cash, managed balances, margin, trades and dividends are explicitly excluded from that chart.
- The approved holdings table uses a real observed Price column where the mockup used fixture Beta. No beta values are fabricated.

## Validation

Test-first: the new test file failed with `ERR_MODULE_NOT_FOUND` before the new model existed, then passed after implementation.

Final focused command:

`node --experimental-strip-types --test tests/approved-workspace.test.mjs tests/portfolio-ledger.test.mjs tests/portfolio-quotes.test.mjs tests/account-balances.test.mjs tests/home-brief.test.mjs`

Result: **22 tests passed, 0 failed**, including ten new tests for empty portfolios, partial/complete quote coverage, duplicated holdings, real balance reconciliation, mixed currencies, older prices, invalid/nonfinite inputs, common historical observation dates, missing/foreign history, future-date rejection and preview/crypto navigation.

`npx tsc --noEmit --pretty false`: **passed, exit 0** after final component changes.

No browser, production build, or live authenticated account/provider verification was run by this task, per its owned scope. Root should validate desktop and phone screenshots, modal scrolling, empty and partial states, mutation flows with configured auth, and run the aggregate suite/build.
