# AURYN approved glass build — verification report

## Result and scope

The approved liquid-glass presentation is implemented across the application. The complete source includes the previous intelligence/recovery changes, account-backed contribution settings, all research sections, portfolio, labs, account screens and deployment instructions. No new paid provider was added.

This is a verified local source build, **not a certification that all production integrations or investment outcomes are verified**. Source has not been pushed or deployed. No broker order, role change or automation activation was performed.

## Fresh checks

| Check | Result | Evidence |
|---|---|---|
| Current release acceptance suite | 944 passed, 0 failed | `release-tests-02.log` |
| Production build and Next type validation | Passed; public-only fixture configuration | `build-final-contrast.log` |
| Light Chromium: 320, 390 and 1024px | 97 passed; no runtime errors or document overflow | `../next-build/glass-final/report.json` |
| Dark Chromium: 390px | 37 passed; no runtime errors or document overflow | `../next-build/glass-dark/report.json` |
| Final contrast adjustment | 12/12 targeted dark screen checks passed after final rebuild | `../next-build/glass-contrast/report.json` |
| Approved-reference layout comparison | All 40 sampled style properties match at 1024px; 39/40 at each mobile width | `../next-build/glass-fidelity/report.json` |
| Financial regression checks | Failing-before / passing-after evidence recorded | `review-regressions-red.log`, `review-regressions-green.log` |
| Contribution input validation | Failing-before / passing-after evidence recorded | `contribution-red.log`, `contribution-green.log` |
| Independent source review | Three important findings fixed; two retained defects fixed; one layout issue corrected | Review resolution below |
| Archive | Every packaged byte checked against manifest; full tracked source inventory checked | `SOURCE_MANIFEST.json`; package result accompanying delivery |

The final change after the broad browser run adjusts only dark assessment/owner text colors. It does not change layout, financial logic or account behavior. The final production rebuild and targeted dark screenshots verify that correction. No separate lint script is configured; build/type checks are not presented as a standalone lint run.

Browser tests use synthetic account, market and broker responses, with explicit unavailable states for absent feed contracts. They exercise rendering and interaction; they do not establish provider accuracy, actual permissions, email delivery or broker execution. The fixture build output is excluded from delivery and must never be deployed. Node 24.19.0, Next 15.5.28 and Chromium 153.0.8010.0 were used.

## What the browser checks cover

- Today, Discover, Saved, Alerts, Research, Portfolio, Trading lab, Research lab, Calibration, Settings, Profile, Help, methodology/legal, login/register/password reset and onboarding.
- Research Overview, Business, Financials, Valuation, Technicals, Earnings/events, Ownership, Risks and Options.
- All eight supported chart periods (1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y), retained chart canvas and page scrolling over charts.
- Metric help, Escape, More menu, account menu and outside dismissal.
- Contribution save, reload persistence and isolation between symbols; weekly WMA, custom 0.686 and expanded chart zoom.
- Saved investment notes, comparisons and delayed explanation responses discarded after company/account changes.

## Review resolution

1. Valuation now uses canonical upside and fair-value-denominated margin of safety. A stale, undated or non-USD comparison rejected by the engine cannot be reconstructed from the display price. The chart price marker uses the same qualified comparison.
2. Workspace mutations/explanations capture account and operation scope; obsolete completions are discarded. Stock holdings clear on account changes and invalidate previous responses.
3. 3M, 6M and 3Y remain reachable through the chart's additional-period selector alongside the five primary periods.
4. Expanded weekly charts retain zoom/reset controls. Unavailable valuation text fits the scenario cards.
5. Research tab changes preserve browser history state and the mounted workspace; the previous loading-screen interruption was corrected.
6. Help icons retain their circular reference shape; dark action/owner text received a contrast correction after visual inspection.

## Fidelity and deliberate differences

`docs/design/approved-glass-2026-10-16/reference.html` is the frozen user-approved reference. Its CSS is adopted in `app/approved-glass.css`; production integration is isolated in `app/glass-integration.css`. The original blue AURYN logo is retained.

`visual-review/index.html` compares reference and application captures. This is **not a 100% pixel-identity claim**. Real source-backed values, missing evidence, provider timestamps, actual company names, accessible controls and functional charts replace fictional populated examples. Additional source records, contract research, journals and diagnostics remain secondary disclosures. The application footer adds 4–6px of mobile bottom padding; desktop navigation is about 9px wider because the working More control includes its chevron. Sampled content-column positions and widths otherwise match.

A 320px viewport was tested, but a physical iPhone, Safari, VoiceOver and a complete accessibility audit were not. Browser screenshots cannot prove native iOS behavior.

## Live configuration and remaining scope

- Prior read-only checks reached Twelve Data (MSFT/BTC quotes), Finnhub profile/logo, Supabase and an ACTIVE Alpaca Paper account. Those checks are dated prior evidence, not a fresh deployment acceptance of this ZIP. See `../product-recovery/connections.json`.
- Workspace and company-source-review migrations were applied earlier. The paper-safety migration `20261016155025_auryn_paper_execution_safety.sql` remains required; its earlier application failed with `Invalid or expired requestState` and its new tables were absent on read-back. It starts paused. Deployment instructions preserve the migration-history mapping.
- Live owner/admin assignment, cross-user RLS, actual signup/reset email, environment parity, scheduled runs, broker acknowledgment/fill/reconciliation and provider entitlements require acceptance in the real environment.
- Alerts are on-refresh/in-app. Background price-threshold delivery, push and email are not enabled or advertised as active.
- DCA settings are preferences and a gated planning insight; they do not place an order or guarantee a return. Missing cash, exposure or evidence can withhold a multiplier.
- The original 104-item requirements ledger remains in `../next-build/requirements.json`. Forward 6–12-month company evidence, full sector/theme/correlation exposure and complete transaction/benchmark histories remain partial; see `../next-build/REMAINING_GAPS.md`. Unsupported specialized valuations, options/gamma feeds, company moat facts and future-return probabilities are not invented.
- No independent investment-performance validation or guarantee of Buy/Sell accuracy is claimed.

## Deliverable

The ZIP contains complete source, lockfile, workflows, SQL migrations, tests, context, reference and reports. `.git`, credentials, dependencies, compiled `.next` output and bulk historical screenshots are excluded. Curated comparisons are included; JSON browser reports preserve the full check inventory. Follow `START_HERE.md` then `GIT_AND_VERCEL.md`.
