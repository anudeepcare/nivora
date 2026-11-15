# Live preproduction visual audit — 12 November 2026

Target: nivora-git-preprod-anudeeppaleru.vercel.app. Authenticated browser inspection. No account records changed.

Observed at desktop viewport (~1353 × 930):
- Home: same APP/OSCR/IREN/HIMS quote information repeated in Market pulse and Your companies. Earnings duplicated in Needs your attention and Earnings & events.
- IREN Overview: action/headline repeated in Pace, 30-second read, and The case in plain words. Historical warning repeated immediately below and again in six checks. Same market cap/growth/margin repeated in global facts and overview metric grid.
- IREN Overview vs Valuation: Overview has no supported scenario range; Valuation shows a volatility fallback as Bear/Base/Bull. Must use one shared selection for default headline cases. Historical risk remains a separate named optional view.
- Valuation cross-method analyst comparison uses quote (~19.35), while analyst panel uses settled close20.84. Target56.69 yields different percentages. Reference basis must be explicit and consistent.
- Business: global Annual cash-flow margin -315.8% remains above TTM -281.5%; selected financial period is not reflected in shared header. Global facts should be confined to Overview so different periods do not appear as conflicting metrics in every tab.
- Targets & estimates: Expectations at a glance repeats target56.69 and172% immediately above identical analyst target panel.
- Technicals: longer-term trend, RSI and volume repeated in brief, mini-summary, and full grids; all moving averages repeated in reference map and grid.
- Case & ownership: case brief duplicates support/challenge/earnings cards directly below.
- News & earnings: three-column layout inspected; no overlap in initial populated view.
- Labs/Options: initial price-level screen inspected. Options snapshot repeats selected expiry and range; expanded modes not yet inspected.
- Watchlist: Review first repeats each stock's same action as table; initial table has unavailable readings while assessment loading. Do not claim those values verified.
- Portfolio: first viewport is dominated by 30-second brief plus Review first; holdings below chart. Priced investment coverage and exclusions repeated.
- Discover: empty screen inspected. Repeated explanation above and below controls.
- Compare: empty screen inspected; redundant company search + ticker input. Submitted IREN,NBIS,NOW for populated state.

- Compare populated IREN/NBIS/NOW: repeated action prose across AURYN View and Pace rows; no initial layout overlap.
- Strategy lab: initial form and empty state inspected; no strategy run submitted.
- Settings: account, appearance and preferences inspected without changes.
- Plans: membership and plan grid inspected. Owner-only payment setup instructions visible.
- Alerts: empty rules/history and condition selector inspected; no alert created.
- Research landing: saved-company cards and search inspected; heading repeats Saved companies.
- Help, Contact and Methodology: initial views inspected; contact form not submitted. Methodology still describes monthly-v5 while active release uses v7; documentation follow-up required.

Implemented in this source:
- One shared StockPillars selection for Overview and Valuation headline cases.
- Analyst percentages in ScenarioLenses use the same settled-close reference as the analyst panel.
- Repeated action narrative and supporting checks collapsed; scenario grid remains visible.
- Global financial facts restricted to Overview, avoiding annual/TTM basis confusion in Business.
- Duplicate Home company quote list removed.
- Duplicate Targets and Case & ownership quick reads removed.
- Data dates and detailed metrics moved into expandable Overview sections.

Validation: full npm run verify passed: lint, formatting, 1,376 tests, TypeScript and production build.

Remaining audit scope: full-page/expanded states, mobile/tablet, monthly plan, owner tools, remaining legal pages and updated-source visual rendering. Local preview was inaccessible from the browser; this ZIP has not been deployed. No complete visual acceptance or 500-stock DCA matching claim is made. Existing Pace benchmark evidence is unchanged by this presentation update.
