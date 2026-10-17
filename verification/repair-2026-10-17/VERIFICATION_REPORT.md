# AURYN UX repair — verification

## Verified

| Gate | Result | Evidence |
| --- | --- | --- |
| Production build, TypeScript/Next checks | Passed | `build-final-03.log` |
| Complete release test manifest | 961 passed; zero failed/skipped | `release-complete.log` |
| Desktop/mobile route and section sweep | 139 passed; zero runtime errors | `../next-build/repair-final/report.json` |
| Final-build interactions | 14 passed; zero runtime errors | `../next-build/repair-final-interactions/report.json` |
| Final-build defect/responsive checks | 38 passed; zero runtime errors | `../next-build/repair-final-responsive/report.json` |
| Known server credential values in deliverable source/docs | No matches | `credential-scan.json` |

The broad sweep covers 21 routes, all nine stock research sections, Light/Dark at 390 and 1440 pixels, and opens 37 nested panels. The final defect sweep adds 320 and 768 pixel layouts, authentication-shell isolation, 29 holdings plus a saved symbol outside the old 12-symbol cutoff, bounded portfolio charts, horizon changes, More alignment, theme previews, close controls, denied paper access and a simulated 47px notch inset.

Final interactions cover chart ranges, wheel scrolling, stable chart identity across tabs, help/Escape, DCA placement, Fibonacci/custom 0.686/weekly chart expansion, watch reasons, delayed-response account isolation, navigation dismissal, quote freshness expiry, logo/search navigation, portfolio add/edit/filter/remove with exact stored cost precision, all five paper tabs, profile/onboarding saves, and account-saved Light/Dark/System preferences.

The broad sweep preceded the final scoped paper-button styling. The final-build interaction and defect sweeps were run afterward; each report records its build ID. Current application-file hashes are in `source-build.json`.

## What the browser tests establish

They run the production-built application in Chromium against intercepted synthetic auth, account, quote and paper services. Writes stay inside the fixture adapter. They validate the actual components, layout and interactions, not production provider permissions or real money movement. The preview renderer uses dated company response captures for financial statements, with clearly labeled illustrative quotes, chart observations and decisions.

The before-fix regression report reproduces seven reported defects. A subsequent control regression reproduces the exposed screen-reader labels. The first broad repair sweep caught mobile indicator overflow; the next sweep passed after it was corrected. Earlier failed/incomplete runs remain as historical evidence and are not acceptance results.

## Read-only production checks

`live-quote-check.json` records returned MSFT/FIGR quotes and research states. `live-chart-check.json` records IREN intraday/weekly-range response counts. These limited reads show endpoint responses, not universal freshness, subscription coverage or correctness of every metric. No broker order, deployment, migration or account-role change was performed in this repair.

## Remaining acceptance limits

- Physical iPhone installed-PWA/Safari, touch gestures, keyboard/viewport behavior and assistive technology need device testing. Safe-area geometry was simulated in Chromium.
- The deployed owner/admin mapping and paper-safety migration were not verified or changed. Submission, broker acknowledgment, fills, cancellation and reconciliation require an authorized paper-account acceptance run.
- Live cross-user Supabase RLS, real sign-in/reset emails, account preference synchronization and provider entitlements were not certified by synthetic tests.
- Some companies lack compatible financial facts or dated business/moat evidence. The interface explains missing data instead of inventing values. Unknown company logos have a monogram fallback.
- DCA intensity and technical levels are experimental research outputs, not validated performance claims or execution authorization.
- Larger-scope implementation gaps remain in `../next-build/REMAINING_GAPS.md`, including independent forward evidence and advanced portfolio exposures/history.
- The production build retains non-fatal Autoprefixer compatibility warnings about start/end alignment in retained feature rules; it completes successfully.

## Reproduce

Use the real deployment environment for `npm ci && npm run verify:release`.

Browser fixtures require a separate local build with `NEXT_PUBLIC_SUPABASE_URL=https://visual.supabase.co` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=visual-public-test-key`, then `npm run start -- --hostname 127.0.0.1 --port 3102`. Run `scripts/verify-midnight-browser.mjs` with Playwright and Chromium configured as described in its header. Do not deploy fixture build output. Use a new `AURYN_BROWSER_OUT` for each run.

`AURYN_EXPAND_PANELS=1` exercises expanded panels; `AURYN_INTERACTIONS_ONLY=1` runs user flows; `AURYN_DEFECTS_ONLY=1` runs the reported-defect checks and selected responsive routes. Browser screenshots are review evidence, not a claim of pixel-identical generated mockups or full production readiness.
