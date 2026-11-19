# AURYN — rebuilt UX and performance source handoff, 7 November 2026

This is the current handoff and supersedes older checkpoints. Source ZIP only: no deployment, production database write, scheduler activation, public observation or external outreach was performed.

## Latest simplification — 8 November 2026 UTC
Removed the standalone Metric formulas & sources entry/modal mount from Research, duplicate Investment context and Supporting facts sections from Overview. Shortened Targets and Valuation introductions, simplified the P/E control wording, and reduced the private notes heading. Existing metric-level help and dated model assumptions remain accessible. These removals do not alter financial calculations. This is a focused simplification of the reported panels, not a claim that every screen has been redesigned.

## Reliability follow-up — 8 November 2026 UTC
Current settled-price context now drives displayed Pace and shared action eligibility. Prior-month closing zones are historical context; an old P4 cannot authorize additions after the current zone weakens to P1. A developing deeper zone cannot increase contribution eligibility above the closing zone. Missing current history blocks Pace additions.

Overview and the default Valuation detail share the decision engine's selected model, reference price and assumptions. Historical price percentiles no longer stand in for valuation scenarios. Alternative price assumptions remain separately accessible. A compact assessment connects business, valuation, price conditions, main concern and the next condition.

No monthly-v5 threshold calibration was introduced. The saved 614-symbol audit has 589 usable comparisons: 74.4% exact monthly-zone agreement, 91.9% inside/outside P2–P4 agreement, and only 34.4% exact agreement within competitor 2X–4X. These results are not 99% parity, live API verification or proof of performance. See `docs/RELIABILITY-RELEASE-20261107.md` for scope. This follow-up requires no new database migration or environment variable. Earlier configuration and migration instructions below still apply.

Fresh verification is recorded in `verification/reliability-20261108/`. Earlier browser checks below predate these new assessment components; no new browser/performance measurement is claimed for them.

## Latest follow-up: mobile menu and header cleanup
Removed the standalone evidence button above Research tabs; metric formulas/sources remain inside Business. Mobile account menu uses a mostly opaque glass surface, explicit readable text, a short transform/opacity entrance and reduced-motion/transparency alternatives. Removed eight unused legacy consent rules (1,142 raw bytes); this is targeted cleanup, not a claim of complete legacy CSS removal or measurable latency improvement by itself. Ten related regression tests, lint, TypeScript and shell browser checks passed.

## Latest follow-up: AURYN theme and explanations
Options now shares AURYN citron selected states and primary actions, teal guidance surfaces, and a clearly marked simulated wallet. Inline help explains the map, controls, selected-cell GEX/coverage and practice sequence. No financial formulas or provider behavior changed. This follow-up was checked with the 74 Options/exposure tests, lint, TypeScript and responsive component browser checks; the full build/API/1,202-test evidence below belongs to the immediately preceding source baseline.

## Changed in this pass
- Labs is a normal tab immediately after News & earnings. Options and Research tools remain inside it.
- Options structure and scoped styles rebuilt: compact expiry/view/tool controls, inline price summary, exposure view first, one data/definitions disclosure, advanced tools on demand, compact practice ticket and ledger. Financial calculations, provider coverage semantics and entitlements retained.
- Owner handbook opens an explanatory chapter instead of a title-only cover. Search, chapter navigation and optional implementation references added. Observation/publication forms moved to a separate owner tab.
- About/Pace, track record and portfolio check rebuilt with shared navigation and compact responsive layouts. Portfolio example/reset and concentration bars make the tool usable immediately. Publication disabled is distinguished from empty/error; real errors offer Retry.
- Overview, Portfolio, Watchlist and Research Home split into dynamic modules. Shared quote/feed hooks extracted. Research overview mounts only after it is selected; visited charts remain available. Request invalidation prevents old responses overwriting refreshes or repopulating cleared account caches.
- On-demand research receipts expose formulas, periods and source links, earnings/risk evidence, manual bounded filing-passage comparison and public-only Markdown export.
- Review fixes: analytics consent owns its styling on direct public loads; invalid/cached Research tabs retain the correct initial panel.

## Retained from recovery
Holdings-aware capped contribution planning, monthly-v5 Pace/business gates, confirmed/forming distinction, P1 watch/hold semantics, explicit thesis rules/queue/guards, prospective recording and study infrastructure, owner-only session recording, account-menu/safe-area/keyboard fixes, rate budgets and access boundaries remain included.

## Verification
Fresh evidence is in `verification/performance-first/`.
- 1,202 unit/regression/database-policy tests passed, zero failures.
- ESLint, formatting, TypeScript and production build passed. Build ran from an identical isolated source copy after shared-workspace output cleanup interference.
- 40 actual-component browser cases: Options, handbook, portfolio check, track record and About at 320, 390, 768 and 1440px, light/dark. No horizontal overflow or page errors; handbook navigation/search and portfolio calculation exercised. These use controlled data/account fixtures.
- Independent review compared extracted workspace/hook bodies with the originals and checked cache isolation and receipt privacy. Both reported findings fixed with regression tests.
- Compiled API suites and 56 production file traces passed. Nine direct production public-page checks (three routes × 320/390/1440px) passed, including consent placement, concentration calculation and no page errors/overflow. Two additional Practice-view browser checks passed.
- Main app first-load JS: 308→254 kB (about 18% lower). Total emitted assets did not shrink overall; see the honest per-type report. Public routes load about 177 kB raw CSS, excluding the legacy workspace sheet.

These checks are not a live audit of every ticker, a physical iPhone/PWA certification, or a measured guarantee of real-world latency. The legacy stylesheet remains for other screens; total dead-CSS cleanup is not claimed.

## Setup and what remains
Read `CONFIGURATION-20261107.md` for exact environment names, the configuration checker and recovered Supabase migration reconciliation. The latest UI/cache/receipt changes need no new schema migration.

Read `REQUIREMENTS-STATUS-20261107.md` for every recovered requirement group and explicit unfinished work. Real backtest datasets/results, prospective observations, participant sessions, scheduler activation and live acceptance remain outstanding. Broker sync, comprehensive TWR/benchmark/tax/non-USD accounting and the advanced NLP/valuation/integration roadmap are not completed by this package. Do not describe all four chats' entire roadmap as finished.

## Run
Node 24: `npm ci`, `npm run verify`, then `npm run test:api`. Optional browser scripts `check-rebuilt-ux.mjs`, `check-public-production.mjs` and `check-shell-layout.mjs` accept `AURYN_ESBUILD_PATH`, `AURYN_PLAYWRIGHT_PATH` and `AURYN_CHROMIUM_PATH` as applicable. The public script expects a local production server (default port 3040).

ZIP contains source, lockfile, tests, migrations, private owner reference and verification; excludes dependencies, build output, git metadata and credentials.

## November 8: reference-led Overview refinement

Applied ideas from both supplied Overview HTML references: open decision presentation with holding/new-purchase context, compact diamond price stages, full-width chart placement, and a faceted eight-lens evidence explorer using existing 0–10 research scores. Missing scores are striped and unscored. Bear/base/bull math remains unchanged and visible. Evidence groups and selected Business/Technical/Valuation metric groups use open rows rather than outlined cards; the valuation expectations calculator starts expanded. Pro tools remain available.

Validation: 1,234 regression tests; lint/types/build; eight responsive light/dark fixture layouts with lens selection, decision context and short-history checks. The browser chart slot is a layout fixture, not a live provider check. No deployment or database changes.

## November 8: cohesive workspace refinement

The opening Research view puts the real price chart beside a compact decision, price checkpoint and five diamond stages with their meanings. Two actual reasons appear immediately; full risks remain accessible. The evidence crystal is optional, mounts when opened and no longer causes an initial hydration mismatch. The Pace caption explicitly names its settled-history reference rather than presenting a potentially different raw quote as Current. Bear/base/bull remain synchronized, with actual EPS/multiple inputs visible when the selected earnings model supplies them. No valuation or decision arithmetic changed.

Shared navigation, Home lists, Watchlist/Portfolio surfaces, summary balances, Options controls and the owner guide use consistent hierarchy, spacing and restrained brand depth. Empty chart states are smaller. Existing Pro metrics and tools remain. The automatic chart resize uses its built-in size observer; the separate fit handler no longer supplies an incompatible manual width and cancels pending work at unmount.

Validation: 40 actual local app-route/theme/viewport checks; eight research interactions with the real chart component, including short-history and 320px states; 40 Options/guide/public-tool interaction layouts; regression suite, production build and types/lint. Demo/fixture observations do not certify paid-provider data or forecast accuracy. No deployment or database changes.

## November 8: structured research cards and persistent scenario state

Restored a compact branded gradient Pace instrument, faceted diamond art and five priced stages. Price-edge formatting keeps cents below $1,000. Repeated multi-band captions are compact counted badges. Business overrides are explicitly explained for Reduce/Sell/Avoid. Evidence and research-desks retain softly coloured metric grids; shared provenance replaces repeated panel footer dates. Bear/base/bull use responsive colour-tinted cards with consistent icons and actual model inputs.

Fixed the missing-model UI: SelectedValuation no longer silently returns null for a stock without a qualified model. It retains three clearly uncalculated cases, displays the model's reason, and keeps analyst consensus separate. This does not manufacture targets or relax financial evidence gates. Removed the empty/double manual-projection accordion, and embedded the price-expectations calculator without repeating the full Investment context heading/navigation. All tools remain in their existing workbench.

Closed Home radar content mounts when opened, avoiding unused initial computation and preview hydration mismatches. Targets & estimates uses stock-scoped stable tab IDs, retaining keyboard navigation and accessible tab/panel linkage. No financial calculations or provider data were changed. No deployment.

Validation: supported/missing-input stock scenarios, three-case presence and absent fabricated targets; 1,234 regression tests; eight responsive theme/width research fixtures; 40 actual local app-route checks including console errors and horizontal overflow; production build and types/lint. Local demo/fixtures are not live-provider certification.
