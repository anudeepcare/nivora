# AURYN midnight release verification — October 16, 2026 (America/Chicago)

## Verified locally

- **Production build:** `build-release.log`, Node 24.19.0 / Next 15.5.28. Compiles, typechecks and generates routes. This verification used a clearly synthetic public Supabase configuration; `.next` is excluded from the source package and must be rebuilt with the real environment.
- **Release acceptance:** `release-tests-final.log`: **961 passed, 0 failed**, no skipped/cancelled tests. The manifest is `verification/release-test-files.json`; the distinct historical inventory is not represented as passing. Final presentation/quote regression check: **13 passed** in `final-presentation-tests.log`.
- **Complete route and research matrix:** `../next-build/midnight-browser-03/report.json`: **131 passed, 0 failed, 0 runtime errors**, including Light/Dark at 390 and 1440px, all primary routes and research sections, chart periods and scrolling, dialogs, Fibonacci, notes, race isolation, logos/navigation, account preference saving/reload/System and expired quotes.
- **Final responsive build:** `../next-build/midnight-responsive-release/report.json`: **112 passed, 0 failed, 0 runtime errors**. Light/Dark at 320, 375, 390, 430, 768, 1280, 1440 and 1920px. Home, Portfolio, Research, overview, technicals, financials and valuation. Document overflow assertions pass. Table content intentionally scrolls within its own container.
- **Final interaction rerun:** `../next-build/midnight-interactions-release/report.json`: **11 passed, 0 failed, 0 runtime errors**, against the final production build.
- **Dependency audit:** `npm-audit.json`: zero reported production-dependency vulnerabilities at check time.
- **Credential scan:** `credential-scan.json`: no exact private server credential matches among packaged candidates. No private environment file is included.
- **Offline real-evidence replay:** `aapl-replay-summary.json`: saved production AAPL inputs return RESEARCH_READY under the new policy and classify as GENERAL_COMPOUNDER rather than AI infrastructure. This is an offline pipeline check, not a current quote or investment recommendation.
- **Independent review:** `FINAL_REVIEW.md`: two important findings fixed; no critical/minor findings raised.

## Design and UX

`docs/design/approved-midnight-2026-10-16/reference.png` is the user-approved direction. Earlier native/glass designs are archived and superseded. `visual-review/index.html` contains the approved concept and real browser captures. Preview fixtures are explicitly labeled. The app has the same visual hierarchy in Light and Dark, with System following the device. The decision/long-term/DCA ribbon comes before evidence tabs and chart. Chart canvas remains mounted when evidence tabs change. Optional portfolio amount settings are collapsed; DCA does not require an amount.

The concept is not a pixel-perfect export for every route, content length or state. Actual names, prices, dates, safe-area behavior and evidence availability differ. Chromium emulation is not physical iPhone/Safari or assistive-technology certification.

## Fix evidence and historical logs

Classification and quote-expiry regressions have recorded failing and passing runs. Earlier browser runs exposed a 4px mobile valuation overflow and timing-sensitive test assertions; these are fixed in the final checks. The first wide-screen run was invalidated at its last route by a concurrent local rebuild; the full 112-case matrix was rerun against an unchanged final production build and passed. Failed/intermediate logs are preserved as history; they are not the current release result.

The current policy invalidates older snapshots. Paper success fixtures now use the exported current policy; old-policy rejection remains tested. No safety gate was relaxed to pass tests. Unavailable valuations remain unavailable when required evidence is missing.

## Still required / not completed

This is a complete **source archive**, not certification that every originally requested capability is complete or production deployment is ready.

- Independent 6–12-month forward evidence is not implemented; that horizon remains UNASSESSED. Fully populated sector/theme/shared-risk exposure, correlation/fund look-through, benchmark returns and an account transaction/corporate-action ledger are not delivered.
- Paper-safety migration, trusted owner/admin allowlist, real environment parity and actual paper preview/submission/fill/reconciliation still need deployment acceptance. No order was sent or automation activated.
- Real Supabase account preference write, login/email delivery and cross-user live RLS were not verified by intercepted browser fixtures.
- Live provider entitlements, quota behavior, fresh stock/crypto data and independent source conflicts must be checked after deployment. Prior dated read-only service checks do not establish current deployment health.
- Specialist valuation methods, reviewed IREN/ASTS company facts and independent outcome validation remain subject to the detailed gap report. No return superiority, probability-of-profit calibration or self-learning claim is made.

Read `CAPABILITIES.md`, `../next-build/REMAINING_GAPS.md` and `GIT_AND_VERCEL.md` before production use. No new paid provider, production push or real-money trading was added.
