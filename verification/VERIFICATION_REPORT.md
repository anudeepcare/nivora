# AURYN source package — final verification

Verified on 15 October 2026 in America/Chicago (some logs use 16 October UTC).

**The complete source package installs, passes current acceptance and builds from a fresh ZIP extraction. Deployment acceptance is still required.** This report does not certify every live integration or call historical failures passes.

## Current results

| Check | Result | Evidence |
|---|---|---|
| Uploaded project structure | All 1,191 non-generated source paths preserved | `source-completeness.json` |
| GitHub structure | All 1,197 tracked paths preserved | `source-completeness.json` |
| Clean dependency install | PASS; installed inside fresh extraction | `logs/clean-install.log` |
| Current acceptance | **605 passed, 0 failed, 0 skipped** across 154 complete test files | `logs/clean-acceptance.log` |
| Production build/type validation | **PASS** from fresh extraction with actual public Supabase settings | `logs/clean-production-build.log` |
| Final source vs tested extraction | Identical application, engine, API, tests and configuration | `tested-source-equivalence.json` |
| New auth/paper browser flows | **10 passed** at 390/1440 px, zero runtime errors/document overflow | `production-followup-browser-report.json` |
| Original historical aggregate | **649 passed, 82 failed** | `logs/historical-final.log` |
| Original baseline historical aggregate | 677 passed, 54 failed | `logs/baseline-engine-tests.log` |
| Archive | All included files inventoried and SHA-256 checked; CRC validated | `SOURCE_MANIFEST.json` at project root; `archive-check.json` |

The local runtime was Node 24.19.0 and locked Next.js 15.5.24. Browser verification used Chromium and intercepted fixtures. The source ZIP excludes compiled `.next` output; deployment must rebuild using its actual public environment. No local credentials are included.

## What changed in this follow-up

- Added full file inventory and repeatable packaging. Preserved every uploaded source path and restored the GitHub-only legacy stylesheet as retained source; the new theme remains active.
- Added broker status/fill reconciliation for owned manual paper orders, recovery by the original client order ID, explicit cancellation review, durable cancellation claims, last-verification timestamps and bounded broker requests. Unknown outcomes never automatically retransmit. `done_for_day` remains refreshable.
- Social sign-in now reads verified provider capabilities. Email remains usable; disabled Google/Apple providers are not offered as working actions.
- Expanded behavioral acceptance to omitted runtime suites after auditing them. Added a blocking build/test CI job and a clearly disclosed advisory historical job. No old tests were altered to manufacture passes.

## Historical tests

The original historical aggregate is unchanged and available as `test:engine` / `test:historical`. Current acceptance is `npm test` / `test:release`. `verify:release` runs current acceptance and production build. The previous version gate remains `verify:legacy-release`.

The 82 historical failures include obsolete source-file paths, JSX strings, CSS selectors, earlier UI copy and scheduler/version contracts. Independent audits found real regressions behind some earlier failures; those were fixed and behaviorally tested. The final increase from the earlier 81 to 82 failures is the old package test expecting `verify:release` to invoke a past version gate. See `RELEASE_TEST_POLICY.md`, `historical-failures.json`, `research-failure-audit.md` and `operations-failure-audit.md`. A passing current gate does not mean all historical tests pass.

## Browser and visual evidence

Earlier verification covers 208 route/width cases, 110 research tab/theme/width cases and 36 interaction/populated-portfolio cases. The previous fixes also passed 10 affected page checks and 44 research checks. New verification covers email-only/enabled/unavailable social sign-in, cancellation review/keep/confirm, preserved partial fills and uncertain-order reconciliation without retransmission. These are synthetic client checks, not actual orders or authenticated database writes.

129 captures are included. `VISUAL_REVIEW.html` pairs the approved reference collage with captures. The new screenshots use the `readiness-` prefix. Full-page screenshots can show fixed navigation at the viewport capture position; they are not pixel-diff baselines. Desktop/mobile Chromium layouts were checked; Safari, Firefox, real mobile devices, screen readers and installed PWA behavior are not certified. The supplied approved reference is a collage, so exact pixel-perfect fidelity is not claimed.

## Real-service observations and remaining blockers

`LIVE_READINESS.md` and `live-service-report.json` record successful direct Supabase, Alpaca Paper, Finnhub and Twelve Data stock/crypto connections. Anonymous reads exposed no private rows. Read-only authenticated-role SQL checks for two actual identities returned no foreign-owner rows on the five main user tables. These checks do not replace real login/email/CRUD testing.

The new manual audit table is absent in the connected database; no trusted app-metadata administrator is assigned; the uploaded local environment lacks the service-role key/admin allowlist. Alpaca reports shorting allowed and margin multiplier 4, which the new manual ticket correctly rejects. Twelve Data extended-hours intraday access returns a subscription-related 403. Only email auth is enabled.

The clean configured local server returned 401 for unauthenticated portfolio and paper APIs. Its AAPL quote returned 503/UNAVAILABLE with execution blocked; local end-to-end data delivery is therefore not marked as passed.

Vercel inspection found the existing `nivora` production deployment READY on Node 24, but the team-scoped detailed deployment request was rejected with 403. The rebuilt source has not been deployed. No database migration, broker setting, actual order, GitHub push or Vercel configuration was changed. See `LIVE_READINESS.md` and `DEPLOYMENT.md` for the concrete configuration/acceptance steps.

## Product scope and limitations

- Manual paper tickets use reviewed day limit orders. A continuous reconciliation worker is not included; opening/refreshing history checks broker state. Actual broker submission/fill/cancel remains to be verified with an intended simulated order.
- Monitor persists price targets and compares available quotes in-app. Email/push notification dispatch is not implemented.
- Portfolio history shows recorded balances, not cash-flow-adjusted performance. Missing prices or outcomes are not fabricated.
- Calibration remains UNPROVEN until enough actual observations mature; software tests cannot substitute for investment-performance evidence.

The ZIP includes source, lockfile, SQL, workflows, original requirements/references, tests, reports and browser harnesses. It excludes dependencies, Git history, build/test output, caches, OS metadata and actual environment credentials. Start with `PROJECT_STRUCTURE.md` and `DEPLOYMENT.md` at the project root.
