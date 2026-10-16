# Offline browser verification

These tests use synthetic account, database, quote and paper-trading responses. They test rendering and client interactions, not real authentication delivery, RLS execution or broker/vendor access. The sample prices and positions are never loaded by the application outside the test harness.

Requirements: Node/npm, the project dependencies, Playwright and a Chromium installation. From the project root:

```sh
npm ci
npm install --no-save playwright
npx playwright install chromium
NEXT_PUBLIC_SUPABASE_URL=https://visual.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=visual-public-test-key npm run build
npm run start -- --port 3100 --hostname 127.0.0.1
```

In another terminal:

```sh
node verification/browser-pages.cjs
node verification/browser-research.cjs
node verification/browser-interactions.cjs
```

The scripts write JSON reports and screenshots into `verification/`. The report labels the fixture boundary explicitly. Optional `AURYN_CHROMIUM_EXECUTABLE` selects an already installed browser executable. The packaged scripts default to Playwright's Chromium.

The cloud verification environment used the runtime's Playwright plus a separately installed Chromium binary, with GPU disabled because software Vulkan initialization was unavailable. Production-build checks use Chromium with an explicit `en-US` locale. They do not cover Safari, Firefox, real touch hardware or iOS standalone behavior. CSS supports safe-area padding and reduced motion, but those real-device modes remain unverified.

The reference is a single collage plus earlier design material, not a set of full-resolution page exports. `VISUAL_REVIEW.html` presents reference and captured screens together for human review; no pixel-difference threshold or exact pixel-match claim is made.

Do not deploy this fixture-configured build. Rebuild with your actual public Supabase values before deployment. No fixture `.env` file is included in the release.

## Follow-up checks

After the same fixture build, start the server on port 3101 and run `node verification/browser-followup.cjs` and `node verification/browser-followup-research.cjs`. These cover 10 affected page/width combinations and 44 research tab/theme/width combinations. They exercise stale research warnings, paper evidence disclosures, calibration proof, chart controls and the shared research header. The earlier reports are retained as baseline evidence.

## Current product research checks

`product-browser.cjs` checks 11 research tabs across both themes at 320/390/430/1440 CSS pixels, responsive decision ordering, reported financial currency/source presentation, valuation disclosure and chart request reuse. It intercepts all application APIs and fixture Supabase auth. Public SEC facts are in `fixtures/product-company.json`; price/action/bar/timeframe evidence is synthetic. It is not an actual iPhone or live-service run.

```sh
NEXT_PUBLIC_SUPABASE_URL=https://visual.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=visual-key npm run build
NEXT_PUBLIC_SUPABASE_URL=https://visual.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=visual-key npm run start -- --hostname 127.0.0.1 -p 3102
# In another terminal with Playwright installed:
node verification/product-browser.cjs
```

Never deploy this fixture-configured build. Use actual public environment variables and rebuild for production. Read `PRODUCT_REVIEW_REPORT.md` for the limits of the result.

## October 16 weekly study and global polish checks

Using the fixture build/server on port 3102 above, run sequentially:

```sh
node verification/weekly-browser.cjs
node verification/polish-browser.cjs
```

`weekly-browser.cjs` covers 11 research tabs × two themes × 320/390/430/1440 CSS-pixel widths, weekly study controls, invalid anchors, dialog Escape dismissal, persisted settings and a single shared 5Y request. It synthesizes daily OHLC history from September 2021 through October 9, 2026. `polish-browser.cjs` smoke-tests 26 route destinations at 320/390/768/1440 in both themes, document overflow, input font sizes and the FAQ preferences link. Redirect routes are included as destinations; they are not 26 unique page designs. Reports are written separately from prior evidence.

Both accept `AURYN_TEST_URL`, `PLAYWRIGHT_MODULE_PATH`, `CHROMIUM_EXECUTABLE_PATH` and JSON `CHROMIUM_ARGS` overrides. Historical harnesses remain in the archive; their selectors may require updates for the newly collapsed daily technical section. The new weekly harness supersedes `product-browser.cjs` for current research interactions. Do not treat a mocked browser pass as actual login, database or order verification.

`node verification/polish-interactions.cjs` additionally exercises fixture-backed portfolio/watchlist/alert/profile/onboarding/sign-out and paper-review presentation, plus populated portfolio layouts. Its service writes are intercepted; it does not submit an actual order or validate live RLS. The output is `polish-interaction-report.json`.
