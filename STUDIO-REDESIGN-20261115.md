# AURYN Studio redesign

This source package is not deployed.

## Visible changes
- Desktop retains top navigation, now an ink-colored editorial bar with an underline for the selected destination. Mobile retains the safe-area-aware bottom menu.
- A warm paper canvas, cobalt controls, amber faceted mark and ink surfaces replace the lavender wash. Financial outcomes keep independent positive, negative, caution and neutral colors.
- Glass card/navigation surfaces use bounded transparency, light highlights and a reduced-transparency fallback.
- Price-history periods now have an explicit visible label/group beside the historical chart; all nine ranges remain. Mobile decision typography and spacing are more compact.
- Research uses a continuous tab rail and separate decision/chart surfaces, with coordinated evidence grids. Metrics and Bear/Base/Bull outputs remain present and governed by the original evidence checks.
- Home adds a numbered launchpad. Portfolio separates the balance anchor from the 2×2 metric ledger. Settings uses a compact masthead and preference grouping.
- Public landing, product walkthrough, pricing and authentication layouts were recomposed rather than only recolored.
- Startup shows a content skeleton instead of the centered “Opening your workspace” page. Slow/error recovery remains available without an artificial minimum delay.

## Data reliability
Confirmed SentiSense HTTP 5xx responses now have a five-minute cooldown instead of being cached as missing for 24 hours. Existing quotas, access boundaries and evidence requirements are unchanged. This does not guarantee scenario availability: an editable EPS/P-E calculator or a consensus midpoint alone does not constitute a verified Bear/Base/Bull range.

## Verification and limitations
Production compilation/build, TypeScript and ESLint completed successfully. Final aggregate results are recorded in verification/studio-20261115/RESULTS.md.
Rendered browser acceptance remains unverified: local Chromium could not start under the execution environment’s socket restrictions and the cloud preview was blocked. Source-level responsive, contrast and interaction tests are not a substitute for visual acceptance. Do not treat this package as a claim that every live screen, account state or ticker has been visually audited.

## Run locally
Use Node 24, run `npm ci`, then `npm run dev`. Run `npm run verify` for the aggregate checks. Development-only illustrative preview routes require `AURYN_ENABLE_PREVIEW=true`; they are disabled in production. No production deployment was performed.
