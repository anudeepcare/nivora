# Options workspace rebuild

## Result

Rebuilt the Options desk markup and replaced its stylesheet. The default workspace now starts with a single command bar (expiration, primary views, advanced tools), followed by one inline stock/range/observation summary and the exposure map. It no longer renders another Options heading, a hero card, trading-activity cards, expiration comparison and diagnostic accordions ahead of the analysis.

## Before / after decisions

- Removed `options-desk`, `options-v2`, `depth-options` and all legacy global Options class dependencies from the desk. Fresh module-owned names provide the entire layout, table, guide, payoff controls and summary styling.
- Replaced the separate header/nav/hero/status stacks with a wrapping command bar and an inline summary. Expiration remains a labeled native select with every known listed date.
- Consolidated quote-quality statistics, source frequency/completeness, observation dates, liquidity criteria and metric definitions into **Data & definitions**.
- Displayed the exposure board immediately. Session volume activity and loaded-expiration comparison are secondary, on-demand surfaces below it. Missing volume produces one sentence, not empty KPI cards. Genuine zero volume remains distinct from absent volume.
- Moved volatility, concentration and gamma sensitivity diagnostics to **Advanced → Volatility & gamma**. Preserved model assumptions, coverage and missing-input behavior.
- Replaced the accumulated exposure-board CSS with one continuous matrix/ladder stylesheet, compact inline summaries, 44px controls/cells, wrapping tool controls and readable full select labels. All/1M/2M/6M/selected-date choices, OI versus gamma, current-price row marker, account/device history, snapshots and export remain available.
- Reorganized Practice into a compact ticket beside the ledger on desktop, stacking at smaller widths. Inline account balances replace large KPI panels; explicit premium/risk review, fresh quote eligibility, partial exits, notes and save/load behavior are unchanged.
- Vanna, trade tape and practice components now use React lazy/Suspense, mounting only when their view is selected. Memoized contract filtering/ranking, volatility context and quote-quality transforms. The existing options summary memo and abort-based fetch/expiry race guard remain intact.

## Changed files

- `components/OptionsDesk.tsx`
- `components/OptionsDesk.module.css`
- `components/OptionsSnapshot.tsx`
- `components/OptionsSnapshot.module.css`
- `components/OptionsSimulation.tsx`
- `components/OptionsSimulation.module.css`
- `components/ExposureBoard.tsx` (metric-neutral heading only)
- `components/ExposureBoard.module.css`
- `components/OptionsExpiryComparison.module.css` (44px targets)
- `components/MarketWorkspace.module.css` (44px account controls)
- `tests/options-readability.test.mjs`

No financial calculation library, entitlement/session logic, production environment, global stylesheet, deployment or account data was changed by this task. Existing account history and paper-trading operations remain explicitly user-triggered.

## Verification

- `node --experimental-strip-types --test tests/options-*.test.mjs tests/exposure-board.test.mjs tests/exposure-workspace-ui.test.mjs`: **74 passed, 0 failed**.
- Render tests cover the populated default workspace, explicit diagnostics view with full/partial gamma coverage, missing chain, contract inspection, guide, missing/zero volume, expiration comparison, practice defaults/cost review and exposure inspection/replay/keyboard behavior.
- Scoped ESLint for OptionsDesk, OptionsSnapshot, OptionsExpiryComparison, OptionsSimulation, ExposureBoard and MarketWorkspace: passed.
- `npx tsc --noEmit --pretty false`: passed.
- Prettier on changed TSX/CSS/test files: passed.
- `git diff --check` scoped to changed files: passed.

## Remaining verification / constraints

Root owns the complete build and browser screenshot pass; this task did not run a full build or claim browser visual verification. Payoff and diagnostic JSX remain within the desk bundle; the separately imported advanced tools are lazy. Global compatibility CSS remains in the repository because this task may not edit global styles and those rules may have other consumers; the rebuilt desk no longer subscribes to those class names. Missing observations and provider coverage continue to limit results rather than becoming invented values.
