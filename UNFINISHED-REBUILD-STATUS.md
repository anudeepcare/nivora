# Auryn ground-up rebuild: unfinished recovery checkpoint

Not deployed. This is a source recovery checkpoint, not a release.

## Verified November 16, 2026 on Mac
- npm run verify: lint, formatting, 1,898 tests, TypeScript and production build passed.
- npm run test:api passed using controlled fixture transport, no network/paid provider calls.
- Isolated Playwright Chromium desktop 1440x1000 and mobile 390x844 renders inspected for public landing, Home, Research, Portfolio, Settings, Help and Watchlist; all Research tabs exercised.
- Public sample tabs, Settings category/theme controls, Ask AURYN, holding/new-purchase decisions and editable valuation assumptions exercised.
- Screenshot-driven corrections: mobile Portfolio/Watchlist page overflow, intact portfolio scenario amounts and borderless presentation, Research evidence/Ask width, public sample icon compression.
- Restored required frozen Pace v7 regression fixtures under tests/fixtures/pace-v7. API test runner now creates its output directory on clean checkouts.

## Still not verified
- Authenticated live-provider end-to-end behavior of this rebuild: isolated local copy has no account/provider secrets. Vercel preprod metadata exists, but no credentials were copied.
- Real-account holdings mutation, payments, production deployment and measured production loading performance.
- Complete accessibility certification or every possible instrument/data state.

Browser screenshots remain local and are deliberately excluded. Archive excludes secrets, environment files, dependencies, runtime installers, caches, logs and git metadata.
