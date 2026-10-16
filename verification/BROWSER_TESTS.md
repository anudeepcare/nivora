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
