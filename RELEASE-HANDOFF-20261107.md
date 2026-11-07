# AURYN — rebuilt UX and performance source handoff, 7 November 2026

This is the current handoff and supersedes older checkpoints. Source ZIP only: no deployment, production database write, scheduler activation, public observation or external outreach was performed.

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
