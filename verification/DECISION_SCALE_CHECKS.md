# Checks for the evidence scale — October 25, 2026

Run in a sandbox with Node 22 and no network, so `npm ci` was not possible.

- New logic tests: 4 of 4 (`tests/decision-scale.test.mjs`) 7 of 7 (`tests/technical-more.test.mjs`) and 3 of 3 (`tests/decision-checklist.test.mjs`) pass.
- Whole existing suite, original archive: 450 tests, 413 pass, 37 fail. Modified archive: 464 tests, 427 pass, the same 37 fail. Every one of the 37 fails with `ERR_MODULE_NOT_FOUND` for packages that are not installed here (for example `typescript`, `postcss`, `@electric-sql/pglite`). They were not investigated further and should pass after `npm ci`.
- Type check: the new decision-scale and technical-more files were checked with `tsc --strict` against minimal React stubs and reported no errors in those files. The full `npm run typecheck` and `npm run build` were NOT run because dependencies are missing.
- Not done: rendering in a browser, mobile/PWA review, `npm run test:api`, deployment.

Please run `npm ci && npm run verify` before relying on this change.

The edited `TechnicalDashboard.tsx` was reviewed by reading only; it could not be type-checked here because its other imports need installed packages.
