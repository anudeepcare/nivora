# Weekly Fibonacci and product UX review

Owner's October 15, 2026 request; execution logs dated October 16 UTC. This is the current source update. Prior reports remain available and are labelled by their original scope.

## Implemented

- New weekly Fibonacci study in Technicals and expandable Overview, with automatic/manual dated anchors, true linear/logarithmic calculations, 50/200-week SMA/WMA, actual overlay toggles, optional extensions, numeric level table and expanded chart.
- Plain-language weekly close, candidate support, reclaim level and selected-swing failure. A completed test and subsequent hold are separate states. Historical moving-average values are used for historical observations; unavailable prior values cannot produce a hold.
- Incomplete current calendar weeks excluded; malformed bars rejected; exact consecutive-week averages; transparent missing/stale history and adjustment limitations. No sample CIFR/CRM/ADUR price is hardcoded as current data.
- Shared typography, financial numerals, clearer card/chrome contrast, focus styles, consistent controls, 44px primary controls and mobile 16px inputs. Improved spacing in landing/auth/account/portfolio/monitor/research/Trading Lab/secondary views, light/dark themes and safe-area navigation. Advanced daily technical detail is now expandable.
- The FAQ preferences link now targets `/personalization` instead of a nonexistent settings route.
- Existing history cache reused. No new paid service, dependency, migration, broker setting or investment-action override.

## Fresh evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Current release gate | **696 passed, 0 failed, 0 skipped** across 161 complete test files | `logs/weekly-acceptance.log` |
| Added weekly feature coverage | 24 calculation + 12 presentation + 3 rendered-view tests | `tests/research-structure.test.mjs`, `research-structure-presentation.test.mjs`, `weekly-structure-view.test.mjs` in root `tests/` |
| Production build and TypeScript | **PASS**, installed locked Next.js 15.5.24 / Node 24.19.0 | `logs/weekly-production-build.log` |
| Original historical aggregate | **649 passed, 82 failed**, same failure names as preceding product update | `logs/weekly-historical.log`, `weekly-historical-comparison.json` |
| Research browser | **88 tab/theme/width cases**, 8 cache/control cases; no runtime errors or page overflow | `weekly-browser-report.json`, `logs/weekly-browser.log` |
| Global route/layout browser | **208 route/theme/width cases**; no page overflow or runtime errors; no visible phone input below 16px | `polish-browser-report.json`, `logs/polish-browser.log` |
| Client interaction/populated portfolio | **36 checks passed**, no runtime errors | `polish-interaction-report.json`, `logs/polish-interactions.log` |
| Tested source fingerprint | Current application/engine/test/config SHA-256 inventory | `weekly-tested-source-hashes.json` |
| Full source preservation | Prior package paths retained; archive checks performed at packaging | `weekly-source-completeness.json`, root `SOURCE_MANIFEST.json` |

The new dated-average regression was first reproduced with failing tests, then fixed and verified. A chart autoscale TypeScript error was corrected before the successful production build. No test-name filters or skips were introduced and no historical tests were deleted to obtain the release count.

## Browser scope

Research: all 11 tabs at 320/390/430/1440 CSS pixels, both themes. Exercises SMA/WMA, linear/log, manual/automatic anchors, same-week invalid selection, all overlay toggles, expanded chart Escape close, saved settings between Overview and Technicals, and one shared 5Y request. The source-backed financial currency and honest missing-valuation checks remain covered.

Global: 26 route destinations at 320/390/768/1440 in both themes. This includes redirect/error destinations, not 26 distinct rendered designs. Checks route rendering, document width, visible input font sizes and the FAQ preference navigation. It does not exercise every possible page action.

Interactions: simulated portfolio create/edit/delete, watchlist create/delete with list ownership, alert create/pause, profile save, appearance persistence, onboarding, paper review/confirmation presentation, populated portfolio Overview/Holdings/Allocation in both themes/four widths, and sign-out. All service writes are intercepted fixtures. An “accepted” paper fixture proves only UI handling, never a real broker submission or fill.

Visual inspection covered weekly light/mobile and dark/desktop, profile and portfolio mobile, login mobile, landing desktop and populated portfolio. The approved blue/navy direction and the four new reference images are retained. There is no pixel-perfect, complete accessibility or proprietary chart-strategy equivalence claim. `WEEKLY_VISUAL_REVIEW.html` links the current screenshots and references.

The builds use fixture public Supabase settings to make offline browser checks reproducible. Rebuild with real public environment values for deployment. No fresh clean dependency installation or physical iPhone/Safari test is claimed. Prior clean-install evidence remains historical. The browser test fixtures never enter normal application data.

## Remaining production boundaries

The code builds and current acceptance passes; **commercial production and investment-performance certification remain open**. The 82 historical failures remain visible, with unchanged names; many are older UI/source contracts, but this report does not waive the complete suite or declare every failure harmless. Earlier audit reports explain investigated regressions and coverage.

Actual deployment of this update, real authentication/email/OAuth/CRUD, end-to-end live quote delivery and intended paper submit/fill/cancel remain unverified here. Prior Supabase/vendor observations and the paper audit-table/admin/broker-protection prerequisites are recorded in `LIVE_READINESS.md`; they were not re-certified by the mocked browser run. No external settings or orders were changed.

Fundamental fair-value implementation/validation, calibrated moat research coverage, adaptive DCA, proprietary diamond replication, push/email alert delivery and live-money automation are not completed by this update. Model proof remains UNPROVEN. Portfolio balance history is not cash-flow-adjusted performance. Weekly chart geometry does not solve these independent gaps.

The ZIP has not been pushed to GitHub or deployed to Vercel by this session. Follow root `DEPLOYMENT.md` after merging the supplied source into the existing checkout. Dependencies, generated build output, Git history and private credentials are excluded; source, SQL, original references, lockfile, workflows, tests and reports are included.
