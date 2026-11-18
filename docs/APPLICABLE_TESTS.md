# Packaged-source validation

Run `npm run test:applicable` for the explicitly scoped packaged-source test suite.
It prints its sole exclusion: `tests/pace-v7.test.mjs`, which requires the intentionally
undistributed frozen reference fixtures under `verification/analyst-and-pace-20261112/`.
This is not a claim that the full reference suite passed. It does not change `npm test`
or `npm run verify`, remove tests, suppress failures, or recreate restricted fixtures.
All other top-level `tests/*.test.mjs` files are discovered and run; any failure propagates.

Additional checks: `npm run lint`, `npm run format:check`, and `npm run build`.
These are local source checks, not live-provider, entitlement, migration, or browser validation.
