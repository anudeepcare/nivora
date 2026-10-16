# AURYN INTELLIGENCE OS — COMPLETE WORK HANDOFF

## READ FIRST — USER'S NONNEGOTIABLE REQUEST
Deliver exactly ONE final production-ready downloadable source ZIP after doing the complete implementation and verification. No intermediate builds or partial ZIPs. Do not respond with a plan instead of building. Do not claim work passed checks that were not run. Continue until complete or report specific blockers truthfully. The source package in this handoff is NOT complete and MUST NOT be presented as final.

## APPROVED PRODUCT DESIGN — HIGHEST PRIORITY
The user approved a comprehensive, premium BLUE/NAVY + WHITE AURYN mockup covering desktop and mobile (roughly 18 screens). The mockup is the exact visual target, NOT inspiration. Refer to the included `design_references/` images, especially the mockup collage; compare all screen references carefully and distinguish mockups from screenshots of the flawed existing app. If exact original mockup pages are not available, identify that limitation rather than inventing pixel-perfect claims. Rebuild all visible pages and components from the ground up. DO NOT reuse legacy screens or keep beige backgrounds, huge BUY/AVOID cards, cramped charts, clipped totals, overlapping mobile nav, or mismatched styles. Existing code may be retained for validated logic, APIs, DB and engine contracts only. Responsive 320/375/390/430px mobile, tablet, 1280/1440/1920px desktop; accessibility, safe-area, touch targets, dark mode only if in mockup. Inspect every screen with browser screenshots and compare to reference; fix until visually consistent.

## REQUIRED COMPLETE ROUTES / USER FLOWS
Marketing landing with mountain hero and clear CTAs, sign up, sign in, password reset, email verification, onboarding, theme/preferences, app home/dashboard, global search, research ticker overview and every stock tab (fundamentals, valuation, technicals, catalysts, risk, decision/thesis), portfolio, holdings/analytics, watchlist, monitor, alerts, Trading Lab (Alpaca PAPER), settings, profile/account, help/FAQ, logout and navigation. Audit the actual Next.js app router to find ALL routes and hidden states; do not rely on this list as exhaustive. All buttons, filters, forms, sort/search, tabs, modals, save actions, and empty/loading/error states must function. Never use decorative fake controls or simulated live prices presented as real.

## PRODUCT PURPOSE AND INTELLIGENCE CONTRACT
Institutional-quality investing decision support, accessible to retail investors. User strongly prefers durable FUNDAMENTALS and business quality over short-term technical noise; technicals are useful for entry/timing, not automatic thesis breaks. Retain the existing AURYN canonical engine: THREE CLOCKS (long-term thesis, independent valuation, tactical deployment); Slow Brain vs Fast Brain; independent Bear/Base/Bull valuation, no anchoring to spot; missing evidence = lower confidence, not forced bearishness; new money vs owner vs long-term actions; no forced BUY quotas. Include clear sources, timestamps, confidence, thesis-break evidence, bull/base/bear scenarios, dilution/FCF, catalysts, and watchlist/portfolio implications. Do not rewrite the engine without regression tests.

## DATA / INTEGRATION CORRECTNESS
Next.js / React / TypeScript / Supabase / Vercel. Data vendors include Twelve Data Growth, Finnhub, SEC EDGAR, MarketData.app, Alpaca (verify actual repo contracts). Fix BTC pricing and source/market session issues. Mark quotes LIVE only if actually current; distinguish Regular / Pre / Post / Delayed / Stale with timestamps and provider provenance. Handle API quota/rate-limit/fallbacks safely. Preserve auth, onboarding preferences and Supabase RLS/data integrity. Alpaca PAPER trading only; never execute real-money orders or claim broker execution without test evidence. Existing Vercel cron + Supabase validation jobs and provider limits must be preserved, including 55 calls/min provider ceiling, background cap 42/min and interactive headroom. Retain GitHub workflows `auryn-v996-validation-queue.yml` and `nivora-calibration-mature.yml`; preserve `TRADING_LAB_CRON_SECRET` workflow/config usage without exposing secret values.

## IMPORTANT PRIOR FAILURE
Many previous releases claimed a mockup-fidelity rebuild but merely changed colors, header, nav, or a few cards. The user has rejected these repeatedly. A root layout had accumulated 11 stylesheets across generations. Avoid additive CSS band-aids; establish one coherent design system and refactor page bodies. Old beige cards, giant BUY/AVOID labels, technical clutter and responsive overflow must disappear. User wants one complete deliverable, not status reports and not another cosmetic ZIP.

## SOURCE / REFERENCES IN THIS HANDOFF
- `source/AURYN_REDESIGN_BUILD_2026_10_15.zip`: latest available in-chat partial source; NOT production verified.
- `source/AURYN_INTELLIGENCE_OS_WORKSPACE_REBUILD.zip`: earlier source for comparison/recovery.
- `design_references/`: user-conversation screenshots and mockup images; inspect and identify reference vs current-state screenshots.
- `context/`: canonical project documentation and technical notes.
Use current repo source as baseline; compare archives for lost fixes. Never overwrite newer working logic blindly.

## IMPLEMENTATION & RELEASE ACCEPTANCE GATES
1. Inventory every app route, component, interaction, API endpoint and env dependency.
2. Map each approved reference screen to implementation and check mobile + desktop.
3. Build new consistent design system and every route body from scratch; do not preserve legacy presentation.
4. Test authentication/onboarding/personalization CRUD, navigation, research, search, portfolio calculations, watchlist, alerts, FAQ, and paper-trading UI; verify no fake buttons.
5. Run npm ci, TypeScript, lint (if configured), unit/integration tests, `npm run build`, applicable `npm run test:engine` and version-specific verifier, then browser-based visual/responsive regression. Include actual command outputs, failures and resolutions.
6. Test connected services with real authorized credentials only when available. Never fabricate Supabase, vendor or Alpaca success. If credentials absent, include an explicit UNVERIFIED checklist and do not call it fully production-verified.
7. Scan release archive for secrets, .env, node_modules, .next and unwanted binary artifacts. Package source, migrations, docs, tests, screenshot comparisons and deployment instructions.
8. Deliver exactly ONE final source ZIP and concise evidence. No intermediate downloads.

## GIT DEPLOYMENT FORMAT — USER PREFERENCE
Provide commands in this order, adjusted for actual release/test script names:
```
npm ci
npm run build
npm run test:engine
# run release-specific verifier when it exists
# run release-specific test command when it exists
git add -A
git add -f .github/workflows/auryn-v996-validation-queue.yml .github/workflows/nivora-calibration-mature.yml
git commit -m "AURYN complete mockup-faithful desktop mobile rebuild"
git push origin main
```
Do not assert these commands pass without running them. Respect environment secrets and deployment safety.

## FINAL OUTPUT CONTRACT
Only ONE finished source ZIP, with README, verification report, screenshots/screens comparison, and exact Git/Vercel deployment steps. If truly blocked, explain blockers rather than mislabeling partial source as final. The user is frustrated by repeated partial ZIPs and repeated apologies; focus on building.
