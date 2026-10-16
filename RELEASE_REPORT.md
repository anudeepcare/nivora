# AURYN intelligence upgrade — release report

**Complete source package; not a completed production acceptance or all-requirements certificate.** Based on `bbdce50b92384acefb3db79978423da92a75e1ea` on `codex/auryn-intelligence-upgrade`. Verification date: October 16, 2026. No commit/push/deployment/live database change/order occurred in this session.

## Delivered implementation

- Shared canonical decision adapter with independent business, valuation, timing, evidence and execution dimensions. Chart weakness alone no longer means a broken business thesis; missing inputs abstain.
- SEC period/filing/restatement normalization, source-linked financial assessment, mature-company bear/base/bull valuation, independent earnings cross-check, sensitivity and implied expectations, and a trusted append-only source-review workflow.
- Fibonacci/weekly studies, custom levels, reproducible anchors, completed-bar timing and first-known setup markers, with range/scroll controls.
- Experimental capped accumulation policies, portfolio purchase previews, immutable decision/review journal, equal-budget replay/walk-forward evaluator, and the latest screenshot-inspired summary/history/comparison graphics.
- Personalized Today/discovery, watch reasons, saved views, peer evidence comparison, deduplicated in-app alerts and guided evidence Q&A.
- Paper-operation authorization, paused control state, database run leases, idempotent intentions, cash/exposure constraints, audited submission and broker reconciliation paths.
- Responsive premium surfaces, light/dark tokens, metric help and corrected mobile touch targets. Original source/workflows and all existing integrations retained.

## Important gaps

The per-item ledger accounts for all 104 approved requirements. **B02, H02 and H04 remain partial:** researched 6–12-month production evidence; fully connected sector/theme/shared-risk and correlation metadata; broader benchmark/account-performance histories. See `verification/next-build/REMAINING_GAPS.md`. They are not described as finished.

Actual owner authorization, production secrets/configuration, three live migrations, vendor entitlements and a controlled Alpaca Paper lifecycle remain unverified. Read-only inspection does not unlock or verify those operations. Source-reviewed IREN/ASTS operating evidence is not populated, specialized numerical valuation methods remain unsupported, and no real unseen-period investment-performance study was completed.

## Current software verification

| Check | Result | Evidence |
|---|---|---|
| Dependency installation | Completed; lockfile retained | `verification/next-build/install.log`, patched-install log |
| Current acceptance + production build | **907 passed, 0 failed, 0 skipped; build passed** | `verification/next-build/verify-release-final.log` |
| TypeScript | Passed in the final Next.js production build | Same log |
| Standalone lint | No lint script configured | `package.json`; not falsely reported as a separate lint pass |
| Production dependency audit | **0 known vulnerabilities at check time** | `verification/next-build/dependency-audit-final.json` |
| Historical inventory | **1,475 / 1,791 passed; 316 failed** | `historical-current.log`, `HISTORICAL_REVIEW.md`, comparison JSON |
| Isolated PostgreSQL policies | Included in acceptance; no skips | Paper/workspace/source-review migration tests |
| Responsive/browser | **661/661 fixture checks +27/27 anonymous local checks passed; zero runtime errors or unlabeled-control cases** | `verification/next-build/browser-release/report.json` |
| Secret-pattern/source diff checks | No selected secret patterns; diff whitespace check passed | Package preflight; not a guarantee no possible sensitive string exists |

Runtime: Node 24.19.0, npm 11.9.0, Next.js 15.5.28, TypeScript from lockfile. PostCSS override 8.5.30. Build uses public-only synthetic Supabase configuration for local browser QA; `.next` is excluded, so Vercel must rebuild using the real deployment environment. No service-role/provider/broker credential is in the package.

Commands actually run: `npm ci`, `npm run verify:release`, `npm run test:historical:all`, `npm audit --omit=dev --json`, `npx tsc --noEmit --incremental false`, `git diff --check`, and the localhost-only `scripts/verify-next-build-browser.mjs`. Separate intermediate red/green logs are retained as development evidence, not presented as final successes.

## Browser boundaries

Final browser reports: 661 fixture cases and 27 public/anonymous cases passed, zero failures, zero runtime errors, zero unlabeled-control cases, no unhandled fixture requests. The 44px target audit still records 200 route/tab observations with smaller desktop/tablet controls; it is an advisory count, not an accessibility certification. No small-target warnings remained in the tested mobile widths.

Production Chromium renders with synthetic intercepted account/database/market/broker data test the requested 320/375/390/430/768/1280/1440/1920 widths and both themes. The runner tests research tabs, holdings CRUD, search/keyboard/help, watch reasons, alert preferences/deduplication, profile/onboarding, comparisons/Ask/Today, accumulation caps/pause/journal/replay, chart controls and mocked paper confirmation. An additional anonymous local pass exercises real locally served public pages and unauthorized API denials.

This is not live Supabase RLS, actual email delivery, a subscribed provider integration or a real broker lifecycle. Physical iPhones, Safari/Firefox, assistive technology and a human usability study were not tested. Approved boards are illustrative collages; no pixel-perfect claim is made. Curated current captures and reference comparisons are in `verification/next-build/visual-review/index.html`; bulk duplicate captures are excluded from the ZIP to keep it practical.

## Delivery and deployment

Read `START_HERE.md`, then `GIT_AND_VERCEL.md`. The package includes the complete source and lockfile, all required workflows, all migrations, safe environment example, tests and reports. `SOURCE_MANIFEST.json` lists file hashes. The packager verifies ZIP CRC and every archived byte against source hashes and checks tracked application/workflow/migration preservation. Dependency directories, compiled caches, credentials and nested archives are excluded.

A downloaded ZIP or a successful npm build does not update GitHub. Copy its `AURYN/` contents into the intended checkout, verify, review, commit and push following the provided commands. Keep paper paused until migrations, trusted owner mapping and live safety checks pass.
