# AURYN 0.2.0-rc.2 — completed code pass and release gates

Continues the approved handoff from commit 2c76d84. Supersedes ACCEPTANCE-RC1.md for current status. No deployment, live database migration, charge, account grant or notification was performed.

## Delivered source

- Mobile/PWA name, logo contrast, navigation selection, footer disclosure, readable desktop/public footer and contextual support/legal return links with query and scroll preservation.
- Public What’s new page, versioned candidate release, account/settings/footer links and published-release notification support.
- Research checklist/digest combining dated earnings, followed-company news, observed filing/evidence/Pace/analyst-target changes, unread saved alerts, due saved reviews and portfolio data/concentration checks. Snooze and reviewed states remain account-scoped on the device. The list explicitly distinguishes incomplete feeds.
- Watchlist upcoming earnings dates, business checkpoints, validated review dates and symbol/price-change/review-date/upcoming-earnings sorting.
- Account-saved research style, depth, horizon, default chart range, watchlist sort, visible overview cards and concentration threshold. Shared account state serializes writes across all mounted controls; unavailable/busy research controls are disabled. Theme, density and motion remain device choices.
- Earnings-to-thesis review: reported EPS/estimate status, comparable revenue/margin/share-count changes, saved business condition, financial period labels and filing links. It does not invent company guidance or causal interpretation of a written thesis.
- Saved research snapshots, period-identity checks, change tracking, existing comparison and printable company briefs surfaced in the research workflow.
- Support diagnostics are opt-in and strip ticker/query/private fields. Optional user-selected images are converted to bounded JPEGs with metadata removed, previewed and removable before submission. Screenshots are privately retained, available to the owner on demand and attached only to the configured owner support email. No screenshots are automatically captured.
- Chart SVG title hydration fixes, accessible page zoom, support privacy wording and merchant-responsibility clarification.
- Existing portfolio accounting, analyst/scenario separation, technical panels, congressional disclosures, owner grants, Free/Pro controls, billing and analytics retained and regression checked.

## Verification

- 917 tests passed; zero failed/skipped. Includes shared preference serialization, screenshot validation/private persistence, owner-only attachment reads, earnings comparisons and evidence identity tests.
- Production build and TypeScript validation passed.
- All nine built-route API regression scripts passed with synthetic identity/provider/database transports; no live payment or production permission claim.
- 48 desktop/mobile light-theme route checks passed without runtime page errors or horizontal overflow; seven interaction checks passed, including public/research return scroll, footer visibility, dark research, diagnostics opt-in and screenshot preparation/removal. A further 48 dark-theme route checks passed, for 96 total desktop/mobile route checks. Manual screenshot review then caught selected-control contrast and duplicate mobile footer links; targeted final checks cover their fixes.
- Reviewer identified two important preference issues (cross-instance overwrites; edits during loading/saving). Both were fixed with shared state, queued writes and disabled controls. No critical issue was found in the reviewed scope. Screenshot storage/owner access added after that review was verified with local Postgres and route tests.

## Audit and remaining external dependencies

The fixed 500-symbol audit remains 491 usable histories passing 4,419 internal checks, with nine unavailable rows retained. See verification/continuation/audit-500/ticker-results.csv and results.json. No algorithm change in this pass invalidates those results.

Independent quote/analyst/fundamental/technical/scenario reconciliation is **not complete**. The connected reference account rejected statistics and analyst targets. SOFI forming Pace differs from the proprietary reference despite an equal close; XOM has a $0.17 same-date source-price difference. Those mismatches remain explicit, not forced to match. Guidance/transcript extraction cannot be certified without an available, authorized guidance/transcript dataset. Financial comparisons above are not a substitute for that dataset.

Production configuration inspection located the Vercel project but failed with 403 team authorization required. The user was given a team-access link. No credentials were read or changed. Live Free/Pro configuration, webhook lifecycle, actual analytics collection and scheduled-job execution remain unverified until access is granted.

Installed-iPhone acceptance still requires a real device: fresh/existing install branding, status areas, virtual keyboard and native touch behavior. Chromium viewport checks are not that acceptance.

The digest implemented here is an in-app review list. The existing bounded operator alert job remains unchanged; automated cross-account outbound digest delivery is not activated or claimed complete. It needs an agreed delivery channel, explicit end-user opt-in and production scheduler configuration. Existing account alert rules continue to work through their established monitor.

Qualified jurisdiction-specific legal review remains an external release requirement; revised wording is not legal sign-off.

## Deployment requirements

1. Apply `supabase/migrations/202611050001_support_screenshot.sql` after the existing support migration. It retains server-only access. Migration was tested locally, not applied to production.
2. Run `npm ci`, `npm test`, `npm run build`, then `npm run test:api` using Node >=22.18. Build requires no real account secrets for these synthetic checks.
3. Check production access enforcement, owner identity, billing/webhook configuration, support email delivery and analytics consent in the deployment environment. Do not infer these settings from passing synthetic tests.
4. Keep the release candidate status until deployment and release acceptance are completed. Published status in lib/releases.ts activates the dismissible release notice.
5. Preview fixtures are illustrative. Do not enable preview account actions as production data. No licensed raw histories, .env files, node_modules or build output are packaged.

## Decisions carried forward

- Preserved financial policies and approved design; no per-ticker overrides to force competitor agreement.
- Kept external evidence gaps visible; no invented guidance or price-accuracy guarantee.
- Reused existing account APIs and isolated private support storage; screenshot feature requires its migration.
- No production changes or external messages were sent from this session.
