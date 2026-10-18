# Broad research build review — 18 October 2026

## Included
See docs/BROAD_BUILD_STATUS.md for the exact implemented/existing/limited matrix. New components expose financial trends, full financial catalog with formulas/CSV, bounded peer comparison, three distinct decision perspectives, earnings checkpoints, ownership disclosures, portfolio exposure, observed session changes and deeper DCA history/simulation. Technical studies are grouped by trend, momentum, volatility/range and volume. Earnings reminders use cached scheduled report dates when connected, with explicit fallback errors. No new paid SDK, options/gamma/ESG entitlement or subscription was introduced.

## Verification
- 191 tests pass, including new missing-period UI, mixed basis/duration, multiple-lot concentration, truncated DCA month, earnings reminder and estimate-observation regressions.
- TypeScript and production build pass.
- Built API fixture suite: 64 checks.
- Ten local production-server fixture routes returned 200 and their expected HTML. Timing observations in broad-ssr-smoke.json are local fixture HTML timing only, not production performance.
- Archive source manifest and CRC are checked during packaging.

## Independent review
One independent read-only reviewer examined core new analysis and UI. Four important findings: missing-scope controls vanished, multiple lots understated concentration, incomplete months entered the DCA simulation, and comparison discarded annual/TTM scope. Each was reproduced in a regression then fixed. Later full-financial-table/ownership/style additions were reviewed by the implementing agent; no second independent review is claimed.

## Limits
No physical installed iPhone, software keyboard, rendered browser screenshot comparison or production frame-rate measurement. The cloud browser could not reach localhost/terminal.local, while a local production HTTP smoke test succeeded. No private subscription token was available for entitlement probes; no live paid AI calls, database mutations, broker orders, Git push or deployment. Company-specific intrinsic valuation and persistent point-in-time revision history are not supplied by these additions. Existing valuation guards remain. This build must not be described as guaranteed profitable, fully institution-ready, production-verified, exact visual parity or a permanent verified PWA fix.
