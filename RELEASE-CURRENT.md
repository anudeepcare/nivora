# AURYN clean presentation rebuild

16 November 2026. Source candidate for preproduction, not a production-approved release. This supersedes older release narratives.

## What changed
- Replaced the global patch stack with one token/foundation/preferences/primitive contract. Removed twelve unused style/test files, including the 43,294-line compatibility cascade. The active global styles total 848 lines; each screen owns its own geometry.
- Rebuilt public navigation/product story, first-load authentication/recovery, loading, search and the authenticated desktop/mobile shell. Public chart is explicitly illustrative, not a fabricated live quote.
- Rebuilt Home around a concise briefing, holdings and coverage, then dated company rows/events. Watchlist and Portfolio have scoped table/chart/form owners; account, accounting and benchmark functions are retained.
- Research has one masthead/tab owner and distinct Investment case, Financials, Valuation, Technicals, Analysts, News & earnings, Research tools and entitled Options views. Internal route IDs remain stable. Redundant selectors/navigation were removed, not features.
- The reference-led Overview uses chart plus navy decision, compact cases/summaries and evidence. Pace, chart, scenario and conclusion styles no longer have repeated override chains. Secondary read-only research evidence opens in dialogs; stateful policy/alert forms stay persistent.
- Supporting discover/compare/alerts/labs/trading/plans/contact/help/legal/owner and public education screens have explicit scoped layouts. Settings retains its independent form owner. Safe areas, keyboard focus, reduced motion/transparency, large text and density preferences remain supported.

## Data corrections
The chart zone cache now survives minute refresh and uses the same completed-day clock as the ladder, with market/history/period/day guards. Short or stale history never acquires a fabricated Pace level.

A separate optional owner-preview target cache preserves future valid observations across cold starts. It does not invent target ranges, fix exhausted allowance, restore already-lost observations or grant a commercial license. It requires the included migration `20261116001606_auryn_preview_target_cache.sql`; that migration has NOT been applied. Missing cache RPC fails closed for optional enrichment. Production/nonowner access remains excluded. Read verification/preview-target-cache.md before deployment.

## Verification and limits
The complete source suite passes 1,744 tests with zero failures. ESLint, formatting, TypeScript, production build and controlled API fixture checks also pass. Logs are stored in verification/clean-rebuild-20261116. Tests include financial safeguards, retained UI control contracts, missing/stale states, responsive source rules and an audit that every direct JSX CSS-module class resolves.

These are source, fixture and server-rendered checks. They do not prove pixel-perfect desktop/mobile appearance or live data completeness. Actual browser rendering remains blocked in this environment: local Chromium could not launch and the cloud preview was explicitly denied. No bypass was attempted. No production push, migration, purchase, subscription or live trade was performed. Do not treat this ZIP as proof of exact DCA Optimizer parity or all-stock accuracy.

## Use
Extract at the repository root. Preserve your environment configuration. Run npm ci, npm test, npm run typecheck and npm run build. Apply only reviewed, unapplied migrations to the intended preproduction database. Check rendered pages and real account/provider states before production promotion. The archive excludes dependencies, build outputs and credentials.

## Build identity
After deployment, /build-info.json identifies this source release. Local built CSS assets total 387,289 bytes versus 1,375,253 bytes in the prior candidate (about 72% less); this is asset size, not a measured page-speed claim.
