# Research and Labs audit — 15 November 2026

## Scope and evidence level

Source-level audit of the Research entry screen, all nine Research sections, five Research tools views and all nine Options views, following AGENTS.md, README.md, DESIGN-PREFERENCES.md and the current mobile-glass design. The approved visual direction is retained. This is not browser or physical-device visual acceptance. Source inspection and regression tests cannot prove rendered hierarchy, wrapping, contrast, focus visibility or touch behavior on a device.

No calculations, API/provider behavior, account permissions or deployment settings changed. No metrics were deleted or replaced. Explanations containing financial limitations were retained rather than shortened into misleading claims.

## Confirmed fixes

1. Horizontally scrolling tables were not consistently keyboard reachable. Added named, focusable regions to financial detail/history, ownership, peer comparison, market benchmarks, annual estimates/revisions, earnings history/estimates, reported business values, evidence comparisons/history, Options contracts/Greeks/term structure and expiry comparison. Options Tape already used this pattern and remains unchanged. Added local focus outlines. Tables remain scrollable and retain all columns.
2. Forecast assumption input/reset controls used 40px targets; the assumption disclosure had only 4px vertical padding. They now have 44px targets, explicit focus treatment and a 16px phone input font. Financial overview annual/quarterly/TTM buttons increased from 40/42px to 44px while keeping their single-row layout.
3. Earnings actual/estimate/surprise values were forced into three columns, including the word “Unavailable”, inside narrow padded mobile panels. The local desk grid now auto-fits 140px minimum columns, capped to the available width. Values and reporting dates are unchanged.

## Coverage inventory

All entries below mean source traced, not visually accepted.

| Surface | States and controls traced | Outcome |
| --- | --- | --- |
| Research home | Search, saved companies, four-item pagination, quote/workspace errors, no saved companies | Existing readable heading/empty state and disabled boundary paging retained; shared HomeMarketCards/Search handled by their owners |
| Shared research shell | Loading skeleton, failed research/retry, source issues/retry, watchlist saving, section dropdown, desktop sections, Labs subnav, free/access fallback, crypto-visible section filtering | Existing controls and coverage messaging retained; no account or routing changes |
| Overview | Decision/Pace, chart periods and line/candles, quote provenance, 30-second read, conditional scenarios, company metrics, evidence scores, expanded consensus/freshness | Existing approved composition retained; no target/model changes |
| Business | Annual/quarterly/TTM, Income/Cash flow/Balance sheet, chart metric/range/style/observations, financial statements/ratios and groups, history, durability, financing | Period targets enlarged; expanded financial history/detail table regions fixed; missing/crypto evidence remains explicit |
| Valuation | Editable price-needs model, bear/base/bull, compare model ranges, consensus, reported market metrics, pricing evidence, model fit/evidence, estimate scenarios, historical price risk, manual assumptions | Forecast controls and disclosure improved; existing sector-specific and missing-input fallbacks retained |
| Case & ownership | Three drivers/risks, no measured supporting/downside evidence, crypto wording, next earnings/revenue/margin checkpoints, institutional/insider ownership, Ask AURYN prompts, business map, expanded business assessment/watch | Ownership table keyboard access fixed; no evidence suppression or changed model claims |
| Targets & estimates | Analyst targets/ratings, annual EPS/revenue, unavailable estimates, estimate coverage, expanded estimate revisions, valuation shortcut; conditional model and price-risk views when embedded in Valuation | Annual estimate/revision tables fixed; keyboard tablist behavior preserved; all forecasts and coverage distinctions retained |
| News & earnings | Source coverage, earnings review, reported insider activity/definitions, unknown earnings date, earnings history and upcoming estimates disclosure | Responsive earnings values and both expanded earnings tables fixed |
| Technicals | Daily/weekly/monthly, chart ranges/styles, completed/forming Pace, trend/momentum/volatility/participation disclosures, levels, anchor dates/methods, custom Fibonacci anchors, monthly zones/history | Existing retained chart state and disclosures preserved; no price-level or signal changes |
| Labs: Risk & conditions | Risk metrics, drawdown, return distribution, recovery/volatility details, insufficient completed observations | Existing two/one-column detail layout and honest short-history state retained |
| Labs: Position design | Position sizing inputs, presets/reset, positive/invalid result, hypothetical boundaries | Existing sizing calculations unchanged |
| Labs: Expectations | Operating expectations and funding/dilution cases, expanded three-case inputs, unsupported sector models, missing evidence | All three scenarios and reasons retained |
| Labs: Market context | Benchmark input/load, metrics/comparison, peer candidate board and company compare | Benchmark/peer tables made keyboard reachable; failure/empty evidence preserved |
| Labs: Historical lens | Pullback/window controls, submit, historical outcome cards and limitations | Historical limits retained; no forecast relabeling |
| Labs: congressional disclosure | Collapsed/expanded, loading, preview/unavailable, error/retry, reported transactions | Existing uncertainty/source wording retained |
| Options: Price levels | Expiry, snapshot, expected move, open interest, walls, loaded-expiry comparison, most-traded strikes | Expiry comparison keyboard region fixed; missing gamma/open-interest inputs remain unavailable |
| Options: Calls & puts | Type/liquidity/contract filters, selection, pagination/show more, empty contracts, expanded Greeks/activity and definitions | Contract and Greeks tables fixed |
| Options: Practice | Contract/quantity, simulated cash/positions, notes, close position, assumptions, save/load ledger, no eligible fresh quotes/status | Existing 44px controls and responsive form retained; no account/ledger behavior changed |
| Options: Guide | Educational groups, Greeks examples and warnings | Existing single-column phone layout retained |
| Options: Volatility & gamma | Gamma coverage/profile, IV/skew, expanded term structure, insufficient input states | Term-structure table keyboard region fixed |
| Options: Vanna exposure | Surface, model inputs and assumptions disclosure, unavailable input coverage | Model and caveats retained |
| Options: Trade tape | Loading/error/retry, refresh/poll, call/put and size filters, sort, summary, source limitations | Existing named keyboard-scroll region retained |
| Options: Long-term contracts | Long-dated expiry filter, no qualifying expiration fallback, contract table | Shared contract table fix applies; short-dated data not relabeled as LEAPS |
| Options: Strategy payoff | Strategy selection, eligible quotes, strikes/quantities, payoff graph, assumptions/assignment risk | Existing responsive layout and financial cautions retained |
| Standalone Strategy lab | Current/legacy rule set, symbol/cost, busy/error, empty prospective history, paired hypothetical results, dated export | Existing explicit technical-only/current-model limits retained; lab-state regression included |

## Automated verification

- New regression file: `tests/full-app-research-accessibility.test.mjs`. AST checks test actual JSX scroll-region attributes; CSS contract checks test the targeted dimensions/layout. These are deliberately static tests, not rendered accessibility certification.
- Observed expected failures before changes: `research-red.log`, `research-red-earnings.log`, `research-red-expanded.log`.
- Focused run after final changes: **28 passed, 0 failed**, including 15 new checks plus research lab state, routing, fallback and targets/estimates checks. Log: `research-focused.log`.
- Focused ESLint and formatting passed on all 12 changed TSX components and six CSS modules; see `research-lint.log` and `research-format.log`.
- Full `npm test` completed during concurrent work with 8 failures in the other worker’s newly added Settings (switch target, feedback placement, headings, phone fields), Monthly plan (palette/main landmark), Admin (narrow controls) and Comparison (named scroll region) checks. Log: `research-full-suite.log`. These failures were reported to the parent; the parent must rerun after concurrent workers finish. This intermediate suite is not final-candidate acceptance.

## Remaining acceptance

Actual 320/390/768/1440px light/dark rendering remains unverified because browser rendering was unavailable in this environment. Check all inventory rows with populated, unavailable and expanded evidence; keyboard-scroll each table; ensure the focus outline remains visible; check iOS input zoom, large text, mobile native selectors, three-case values, long company names, option symbols, and safe-area clearance. Live provider coverage, real account gates and physical-device behavior were not exercised. No deployment performed.

## Combined candidate verification

After all presentation edits finished, the final `npm run verify` completed successfully: 1,616 tests passed, zero failed or skipped, with lint, formatting, typecheck and production build also passing. The parent summary records API/HTTP/package outcomes separately. Earlier concurrent runs above are historical, not the final result. Browser and device acceptance remain unverified.
