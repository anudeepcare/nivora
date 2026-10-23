# Latest validation — 23 October 2026

This is the complete application source, not just the validation bundle. See `docs/DCA_FROZEN_VALIDATION.md` and `verification/dca-frozen-validation.json`. Frozen monthly-v5 was evaluated on eight additional securities over 68 execution months with equal contributions: one win, two losses, five ties versus ordinary DCA; mean ending-value difference +0.044%. This is not evidence of a superior investment algorithm. Production thresholds were not retuned to improve these results. The report discusses reserve funding, dividends, cash yield, survivorship and further validation. Earlier parity results below refer to calibration examples, not proven investment performance.

# Latest combined update — 23 October 2026

Read `docs/SCENARIOS_AND_MONTHLY_V5.md`, `docs/HOME_DAY_AND_DOMAIN_FOLLOWUP.md` and `verification/REPORT.json` first. SOFI, TTD, CRWV and ONDS match the supplied October 22 monthly readings; the current 17-stock calibration sample matches 34/34. Two older IREN months still differ; no universal parity is claimed. Overview/Value use eligible earnings cases or explicitly labelled historical price-risk Bear/Base/Bull, not consensus substitution. Home now selects by session impact, shows coverage and expands all returned matching news. The requested setup panel is hidden and research/footer spacing is tightened. EODHD remains primary. Both domains serve the same build/Supabase project; custom-domain password failure is not reproduced or certified fixed. Earlier entries below are historical.

# Latest scenario and DCA correction — 23 October 2026

Read `docs/SCENARIOS_AND_MONTHLY_V5.md` and `verification/REPORT.json` first. Supplied October 22 monthly readings now match: SOFI 3×/3×, TTD 4×/3×, CRWV 1×/4× (confirmed/forming). CRWV uses explicitly limited listing history. Current 16-stock comparison is 32/32; two older IREN months still differ, so universal parity is not claimed. Overview/Value show eligible earnings cases or explicitly labelled historical price-risk Bear/Base/Bull cases, not consensus substitution. Price-risk is not company fair value. Numeric cases still require sufficient valid data. EODHD remains primary. 452 tests, production build, 86 compiled API checks and 12 local HTTP checks pass. Production/device/pixel acceptance remains unverified; no deploy or push was performed. Earlier entries below are historical.

# Latest approved public, sign-in and Home build — 23 October 2026

Read `docs/APPROVED_PUBLIC_AUTH_HOME_20261023.md` and `verification/REPORT.json` first. EODHD is primary for quotes, intraday and daily history; Twelve Data remains fallback. The approved public research panorama, focused authentication and account-driven Home briefing are implemented. Verification: 444 tests, TypeScript, production build, 86 compiled API checks and 12 local production HTTP checks passed. **DCA parity and automatic bear/base/bull for every ticker are not resolved.** Pixel matching, physical installed-iPhone and live OAuth acceptance remain unverified. Earlier entries below are historical. Do not replace missing real data with mock values or hardcode competitor signals.

# Current landing and X correction — 23 October 2026

Read `docs/LANDING_AND_X_AVAILABILITY.md` first. Enlarged landing buttons, removed “Before you begin,” restored sample chart colors and corrected the missing-X provider flag. The supplied dashboard shows X OAuth2 enabled; public settings omit X, which must not be treated as disabled. No credential changes are needed solely because of the earlier message. 440 tests, production build, 86 compiled API checks and 12 local HTTP checks pass. Deploy this source before testing the corrected button. Live OAuth, rendered-source and physical iPhone acceptance remain unverified; no push/deployment performed. Earlier status entries below are historical.

# Approved research composition — 23 October

Read `docs/APPROVED_RESEARCH_20261023.md` and `verification/REPORT.json` first. Shared tokens, the stock-overview composition, annual trend charts and confirmed/forming DCA presentation were updated. The approved image contains illustrative numbers; never use them as production data. PWA geometry, quote retention and model eligibility remain unchanged. This revision does not claim every page has been redesigned or visually accepted.

# Current scenario selection

Read `docs/SCENARIO_PRIORITY.md`: eligible earnings Bear/Base/Bull cases take priority over analyst consensus; revenue-only sensitivities do not become headline valuations. This supersedes the earlier blanket suppression instruction below.

# Current valuation correction

Read `docs/FUNDED_SCENARIOS.md` first for this release. Forecast-multiple outputs are exploratory only; do not restore them as headline fair values. The new funded workbench requires explicit personal assumptions and is not automatic company-specific research.

# Current scenario correction

Read `docs/SCENARIO_PIPELINE_CORRECTIONS.md` for exact shared fixes and live-data limits. Preserve input validation and the PWA shell.

# Current Overview

Read `docs/VISUAL_OVERVIEW.md` for the latest composition. Preserve the PWA shell, quote retention and existing evidence engines.

# Latest correction

See `docs/REFRESH_CONSISTENCY.md` for quote retention, first-screen decisions and pricing update behaviour. Preserve the installed PWA shell.

EVIDENCE-LED PRODUCT BUILD — 2026-10-19
Public storefront at /, fictional interactive walkthrough at /sample, separate signup at /login?mode=signup. Overview now layers business, conditional value, contribution condition, priority risk and dated evidence. Technicals includes monthly zone candles and an experimental robust candidate with equal-budget historical comparison. Original production policy, portfolio refresh/accounting and PWA geometry retained. Read docs/EVIDENCE_PRODUCT_BUILD.md for exact scope and limits. Candidate is not promoted as superior; five real-history checks have mixed results. No new SQL required. Final verification/report: 291 tests, 83 API checks, production build; no physical device/rendered browser confirmation.

Portfolio reliability update: older usable USD prices retain values across totals, rows, charts and exposure. Coherent background batches preserve last quotes after failure. Account-scoped on-device quote retention; Balanced (5 minutes), Live, Hourly and Manual controls. On-demand US sector benchmark comparison uses matching dates versus SPY and explicit missing history. No new SQL required beyond the earlier account-balances setup. Historical account returns are not reconstructed from current holdings. Verification details in REPORT.json; live provider and device visual verification unavailable.

Balance editor repair: readable independent form colours, compact two-column desktop/stacked mobile fields, comma-formatted USD entry without spinner or browser step errors, Save/Cancel. Existing margin and managed-balance database schema is unchanged; no additional SQL needed if setup already ran. 275 tests passed.

Account balances update: run docs/sql/ACCOUNT_BALANCES_SETUP.sql in Supabase SQL Editor. This seeds only Anudeep's $116,312 margin debt. The exact managed portfolio value remains unset; enter it via Portfolio > Edit margin & managed balance, excluding already listed holdings. Net equity is separate from gross assets and investment return. Quote timestamps are compact with full dates accessible. Verification: 274 tests, 82 API checks, production build. SQL tested locally, not applied live.

Desktop alignment update: research tabs no longer overlay content; portfolio columns and quote timestamps align; Advanced hero contrast corrected. Mobile ledger grid and PWA shell preserved. Tests: 269; fixture API checks: 77. Physical iPhone/browser visual confirmation remains unavailable.

> Latest interaction update: read `docs/INTERACTION_AND_TRUST.md`. Keep dark tokens local to the balance card, immutable evidence caching and the existing PWA shell.

> Latest: `docs/PORTFOLIO_LEDGER_REPAIR.md` covers the Portfolio layout repair and new charts. Preserve the isolated ledger classes and existing PWA shell.

> Latest product refinement: read `docs/PRODUCT_REFINEMENT.md` before earlier release notes. No deployed-provider or physical-iPhone acceptance is claimed.

> Current release, 19 October: read `docs/CONNECTED_PRODUCT.md` for all fifteen approved product points and `docs/RELEASE_STATUS.md` for current acceptance limits. Older sections below are historical context.

> Latest update: shared price-trust and cost controls require the migration and enable flag in `docs/TRUST_AND_COST_CONTROLS.md`. They have not been activated in production here.

# Start here — AURYN, 17 October 2026

This archive contains the complete standalone application source, tests, assets, migrations, approved design reference and deployment instructions. It is not proof that every inherited product requirement is production accepted. Read README.md, docs/RELEASE_STATUS.md and docs/DEPLOYMENT.md.

## Current approved build — studio design

The user approved `docs/design/approved-studio-20261017.html` in chat and explicitly requested the same metric selection with no extra/redundant primary panels. This supersedes the earlier sidebar design. Read `verification/APPROVED_STUDIO_REPORT.md` first for implementation, numbers/model distinctions, test evidence and remaining browser/device/live-connection checks. The source uses the prototype style foundation and a focused React integration stylesheet, lighter top navigation, floating mobile dock, compact settings sheet and the five approved research tabs. Lists restore their position after loading settles and cancel automatic restoration on user gestures.

Do not replace missing live data with prototype sample prices/targets. Outlook values are dated EPS/multiple sensitivities, not certified company-specific fair values. No deployment, paid-provider/AI activation, database migration or broker execution was performed for this build.

## Previous update — action clarity and control repairs

Latest follow-up: read verification/RESEARCH_MOBILE_REPAIR_20261017.md and docs/RESEARCH_TERMINAL_SPEC_20261017.md. The root layout now retains the account session and shell between routes; mobile holdings, tab scroll memory and quote status were revised. APP valuation-marker geometry and earnings/debt interpretation were corrected. These source changes still need rendered and physical-iPhone acceptance. The 11-instrument quote check is not a completed fundamental/model comparison.

Read docs/DECISION_GUIDE.md, verification/UI_CONTROL_AUDIT_20261017.md and verification/REFERENCE_REVIEW_20261017.md. The first research screen now has a compact financial/action summary instead of the large text takeaway. Conditional buy/hold/trim/sell-review labels use dated evidence; stale history and missing business classification cannot produce a buy candidate. DCA remains a separate original price-only experiment with visible 0×–4× and confirmed/forming dates. Sector/industry metadata protects bank, insurer, REIT and nonbank-financial models. Shared dialogs, search, mobile holdings, period labels and stale research-comparison results were repaired. Physical-iPhone and post-patch rendered acceptance remain open.

## Latest repair — preserve this distinction

HIMS exposed a period mismatch: the old headline used profitable 2025 annual data while its latest TTM showed losses. Current summaries, financial cards and investment case now use the latest complete TTM when available. Do not restore a generic zero-growth valuation as an authoritative base case or trigger Buy/Avoid from it. Operating cash flow less provider capex is a calculation and may differ from company-reported FCF. See verification/LIVE_UI_AUDIT_20261017.md.

## Latest decisions — preserve these

The user has paid for both Twelve Data and EODHD All-in-One. Use Twelve Data for quotes and intraday charts; EODHD for daily history, financial statements, forecasts, valuation context, ownership, company events, news and filings. Cache and deduplicate requests. Use a labelled, whole-result fallback for price failures. Do not merge two providers' financial periods or splice their chart bars. No additional subscription or paid AI activation is authorized by this data integration.

The user reports configuring EODHD_API_KEY in their deployment. The build environment could not independently access that key: it was absent locally and the Vercel connector returned a scope authorization error. Do not mislabel this as an invalid key or a failed paid subscription. The current build/API tests use fixture transports, and public EODHD demo normalization was checked separately.

The previous approved design was docs/design/approved-pwa-20261017.html; it is superseded by the studio reference above. Earlier HTML and image references are historical. The live React implementation uses the approved design tokens and five research tabs: Snapshot, Financials, Valuation, Technicals and Thesis. Desktop sidebar and four-item mobile navigation, readable light/dark/system preferences, visible amount-free 0×–4× monthly accumulation context, source dates and clear metric explanations are required. The deployed predecessor has now had a signed-in browser audit and supplied iPhone screenshots were inspected. The patched source still needs rendered preview and physical-iPhone acceptance. Never claim exact visual matching on compilation alone.

Keep the product simple. Preserve AURYN branding. Do not reintroduce the removed portfolio purchase/stress/import panels or private-thesis/snapshot/Compare controls into the primary UI. Charts must not capture normal page scrolling. BTC/USD and ETH/USD must never silently resolve to ETFs. SAP's US quote must not turn EUR financials into USD values. Unknown data stays unknown, not zero or fabricated advice.

The full inherited 104-item scope and evidence notes are in docs/requirements-inherited.json; material remaining scope is in docs/RELEASE_STATUS.md. This release does not validate an investing edge, competitor superiority, universal data coverage or commercial resale rights.

Existing account records remain in Supabase. No database schema change was needed for this provider/UI update. Previously installed migrations are documented in verification/LIVE_SETUP.md; do not blindly rerun them. Never put secrets in source, ZIPs or NEXT_PUBLIC_* variables. Paper scheduling/execution and paid AI remain off by default. The Mac project is the extracted AURYN directory containing package.json, not a nested product directory.

Latest October 19 research/visual additions and exact remaining scope: see docs/RESEARCH_RETENTION_RELEASE.md (RESEARCH_RETENTION_RELEASE.md from this docs directory). Latest automated verification: 219 tests, TypeScript, production build and 64 API fixtures. Billing and the full commercial roadmap are not complete.
