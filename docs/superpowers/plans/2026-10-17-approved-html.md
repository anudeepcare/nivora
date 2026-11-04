# Approved HTML implementation plan

**Goal:** Port the user-approved interactive HTML into the existing React app, correct the mobile heading collision, and preserve real research/account data.

**Architecture:** The accepted `docs/design/approved-interactive.html` is the visual specification. Replace the stylesheet with its tokens and component geometry; adapt existing components instead of embedding the prototype or copying its invented data. Keep existing authenticated API contracts and investment calculations.

**Tech stack:** Existing Next.js, React, TypeScript, Lightweight Charts, Supabase.

## Constraints and review focus

- Preserve 16px base type, approved light/dark colors, 22px panel corners, 216px desktop sidebar, 4-item mobile navigation, and 44px controls.
- Mobile heading uses explicit name/save and quote rows; long company names must wrap without intersecting controls. Keep safe-area padding and bottom navigation clearance.
- Never infer missing values or insert the prototype's sample prices into production. No provider purchase, paid AI call, order, database mutation or deployment is part of this repair.
- Keep source/model explanations accessible; core research tabs precede specialist tabs on one scrollable row, with no More menu.
- Remove Purchase impact, Portfolio stress and CSV import from Portfolio as explicitly requested.
- Test ambiguous crypto aliases, foreign-domiciled US ADRs, invalid symbols inside a quote batch, stale/missing quotes and missing AI configuration.

## Tasks

- [x] 1. Add search-selection and mixed-batch regressions; correct symbol selection and listing validation. Include SAP, HIMS, OSCR, BTC/USD and ETH/USD in verification.
- [x] 2. Port shell, research, financial charts, valuation, DCA, technical chart/levels, overview, watchlist, portfolio and preferences. Use engine outputs and existing mutations. Replace CSS, retain specialist controls, and apply mobile/PWA fixes.
- [x] 3. Run domain/Postgres tests, route type generation, TypeScript, production build and built-handler checks; review changed code. Verify exact-source installer in a disposable repository and package source with reports and update commands.

## Verification limits

Browser control is unavailable in the managed environment; do not invent a screenshot comparison or physical-iPhone pass. Vercel deployment inspection last returned access denied. AI generation requires an enabled provider/model/key and budget; identify the exact missing setup without silently enabling paid generation.

## Progress

Approved by the user in chat at 08:12 on October 17; subsequent removal and ticker requirements incorporated. Implementation proceeds in the existing isolated product branch. Prior installation repair files remain part of this delivery to avoid mixed source on the user's Mac.


## Implementation and verification ledger

- Task 1: implemented. Search-selection and foreign-issuer ADR regressions observed RED→GREEN (12 targeted checks initially); mixed malformed quote batch observed HTTP 503 before repair and HTTP 200 with per-symbol failure afterward.
- Task 2: implemented. Shell, preferences, company header, research signals/chart, financial-card styling, valuation range/scenario selection, technical levels, DCA, overview, watchlist and portfolio use the approved HTML geometry and palette. PortfolioTools is no longer mounted.
- Ruling: show actual portfolio allocation, not the illustrative HTML's synthetic portfolio performance line — no transaction ledger exists to establish historical portfolio returns. Cost: no portfolio-performance chart until real ledger data is available.
- Ruling: retain specialist pages behind Preferences links and additional research tabs — preserve working account/engine features while keeping four primary navigation destinations. Cost: those specialist destinations require opening Preferences.
- Ruling: preserve the approved HTML as a reference; production content comes only from account data, provider evidence and actual engine calculations. Missing evidence remains visible rather than copying sample prices or verdicts.
- Final review: independent Astra, read-only, product changes only. No Critical findings. Bear preset mismatch reproduced by executing the actual component's scenario button callback; corrected terminal growth to the selected scenario.
- Final review grading: scenario bounds and DCA period labeling were treated as Important because they change the financial interpretation of the chart; edge-label overflow was treated as Important given the explicit mobile-layout acceptance requirement. Regressions covered scenario bounds and 12-month date slicing; label geometry corrected in CSS/markup, not browser-verified.
- Task 3: complete. Final verify: 57/57 tests, route types, TypeScript and production build passed. API checks: 37/37. Actual ZIP CLI rehearsal verified source checksums, old-file archival and Git/environment/Vercel preservation. Final package CRC/checksum/secret scan passed. Browser/physical-PWA/deployed AI remain explicit external acceptance gates.
