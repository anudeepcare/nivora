# AURYN 0.2.0-rc.1 — continuation handoff

Candidate source continued from attached AURYN 2.zip, commit 2c76d84. The approved discussion is preserved in APPROVED_HANDOFF.txt. This is a verified implementation increment, **not acceptance of every item in that broad scope**, and it has not been deployed or published.

## Implemented in this continuation

| Area | Delivered behavior |
|---|---|
| Footer and navigation | Compact mobile Help & legal disclosure, visible desktop links, tighter public footer, contextual document return preserving supported local routes/query/hash and scroll, safe direct-entry fallback. |
| Mobile and branding | Restrained dock selection, short AURYN manifest name, valid research shortcut, white-logo contrast for HIMS/NOW, accessible browser zoom. Existing opaque diamond Apple touch icon retained. |
| Settings | Account-saved chart period, watchlist symbol/change/review-date order, optional concentration threshold. Manual chart choices win over delayed preference loads; consecutive saves merge the latest acknowledged state. |
| Releases | Public /changelog, account/settings/footer entry points, app version in support, candidate/published distinction, dismissible notice only for published releases. |
| Research checklist | Dated earnings tasks, due saved reviews, missing basis, stale/missing USD quotes and user-chosen concentration checks. Reviewed/snoozed state is scoped by account on the device. |
| Watchlist | Compact count summary; saved business checkpoint and validated review date; note preservation and review-date sorting. |
| Earnings review | Dated EPS actual/estimate comparison, pending results distinguished, zero and negative estimate handling, saved business question and filing/source context. No unsupported guidance assertions. |
| Research evidence | Mounted existing change/coverage panels, saved snapshots and printable company brief. Evidence revisions require matching period start/end, period basis, accounting basis, currency and units. Legacy incomplete identity does not count as a comparable revision. |
| Chart rendering | Fixed multi-child SVG titles in business, financial and valuation charts, which caused server/browser hydration mismatches. |
| Payment language | Clarified that Stripe processing does not transfer AURYN's service/support responsibilities. No legal immunity or jurisdiction-specific approval claimed. |
| Audit | Fixed 500-symbol universe, dated CSV/JSON with unavailable coverage retained, nine internal checks per usable history, explicit not-compared external statuses. |

Existing comparison, financial/technical panels, congressional activity, portfolio accounting, price alerts, owner grants, billing and analytics were preserved and regression checked; they are not represented as newly built features.

## Verification

- 906 tests passed, zero failed/skipped.
- Next.js production build passed, including TypeScript checking.
- All nine built-route API regression scripts passed. They use synthetic identity/database/provider transports, not live payments or production authorization configuration.
- 32 desktop/mobile route checks passed without runtime page errors or horizontal overflow. Four interaction checks passed: public scroll return, research query/scroll return, desktop footer visibility and dark research layout. Browser route and interaction results are in verification/continuation/browser-checks.json and browser-interactions.json. Preview fixtures are illustrative, not live market validation.
- Reviewer findings resolved: preference save race, delayed chart-default race, public scroll return, evidence period identity, explicit note-fetch failures and correct earnings destination.
- Browser review additionally found and fixed chart hydration errors and desktop footer links hidden by a closed details element.

## 500-symbol results

Cutoff: 2026-11-05 00:00 UTC (November 4, America/Chicago). A predeclared convenience universe, not a representative index or survivorship-free sample. 501 daily bars were requested.

| Measure | Result |
|---|---:|
| Requested symbols | 500 |
| Usable histories | 491 |
| Internal-check passes | 491 |
| Failed usable-history rows | 0 |
| Unavailable histories | 9 |
| Internal checks | 4,419 |

Unavailable: WBD, ANSS, AVB, CTRA, EA, HES, HOLX, IPG, QRVO. Exact provider reasons appear in each row. They were not replaced or counted as passing.

Checked OHLC/unique dates, latest close and SMA arithmetic, Wilder RSI, Fibonacci, volume ratios, cutoff discipline, prefix invariance and confirmed/forming monthly behavior. These checks do **not** validate all technical indicators or establish market-data agreement. All independent quote/Pace/scenario/analyst/fundamental/technical reference fields explicitly remain not-compared. Licensed raw histories are excluded from the distribution; input hashes and result provenance are included.

## Open acceptance and implementation work

1. Independent full-metric reconciliation remains incomplete: the connected reference account denied statistics and analyst targets. Do not infer production-provider failure from that entitlement. Earlier SOFI provisional Pace and XOM dated-close discrepancies remain unresolved; no formula was changed to force a match.
2. Physical installed-iPhone testing is pending: fresh/existing install branding, status/safe areas, virtual keyboard and touch behavior. Chromium viewport checks cannot substitute for it. Full light/dark coverage of every populated/empty/error state also remains open.
3. Live production Free/Pro settings, paid webhook reconciliation, grant/revocation propagation and actual analytics collection have not been inspected. Synthetic regressions passed; AURYN_ACCESS_ENABLED=true and enforced owner configuration remain operational prerequisites.
4. The checklist currently covers earnings, saved reviews and portfolio attention. Filing/news, confirmed-Pace changes, reached alerts and estimate-revision tasks are not yet all unified into it. Background notification digest scheduling is not newly implemented.
5. Watchlist upcoming-event sorting and an earnings date on every row remain open. The delivered sorts are symbol, price change and saved review date. Existing price alerts remain separate.
6. Guidance/transcript-to-thesis extraction is not implemented. The earnings review uses available reported EPS, estimates, saved questions and filings, and does not invent causal conclusions.
7. Cross-device preferences cover chart range, watchlist order and concentration threshold. Existing style, research depth, theme and density remain device preferences; visible-metric synchronization is not delivered.
8. Support displays the version; automatic screenshot attachment and a fuller diagnostics submission flow remain open. No private holdings/notes are automatically attached.
9. Existing comparison, exposure, admin aggregate reporting and chart/reference-map surfaces require a deeper live-data visual acceptance pass before claiming the entire proposed redesign complete.
10. Legal text remains subject to qualified review for actual jurisdictions and commercial operation. No legal sign-off is claimed.

## Run and release

Use Node >=22.18; npm ci; npm test; npm run build; npm run test:api. Configure secrets from .env.example using docs/DEPLOYMENT.md. Preview builds use AURYN_ENABLE_PREVIEW=true solely for illustrative acceptance; do not enable demo/account actions in production. No secrets, node_modules, generated .next output or raw licensed audit data are packaged.

Maintain release entries in lib/releases.ts. Keep this entry candidate until deployment and the applicable acceptance checks are completed. Set published only when actually released; that enables the dismissible update notice. package.json and package-lock.json match the candidate version.
