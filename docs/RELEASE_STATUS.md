# Current build — unified research, 23 October 2026

Read `docs/UNIFIED_BUILD_20261023.md` (or `UNIFIED_BUILD_20261023.md` from this docs directory), `docs/COMPETITOR_COMPARISON_20261023.md`, `docs/MONTHLY_POLICY_V3.md` and `verification/REPORT.json`. This build includes full source, shared all-page content styling, Business durability, model suitability, header market cap, public Why AURYN and monthly-v3 across Overview/Technicals. 380 tests, TypeScript, production build and 83 compiled API checks passed. No new SQL is needed for this continuation. Physical iPhone, exact visual parity, complete live entitlements and commercial readiness are not certified.

## Historical notes below

The dated sections below describe earlier iterations. Their old test counts, “current” labels and v1/v2 headline-policy statements are historical; this top section and the unified report supersede them.

# Restore scenario priority — current

Replaces the mistaken global suppression of headline scenarios with model-specific selection: eligible earnings cases first, analyst consensus only as fallback. Recent older quotes retain earnings cases with an explicit label. The inflated revenue model is not restored. Includes analyst card polish. See `SCENARIO_PRIORITY.md`.

# Analyst card presentation polish — current

Scoped analyst card only: subtle metric surfaces, aligned target/gap values, compact dated quote row, shorter opinion note, and optional coverage disclosure. Target eligibility, numbers, provider calls and quote-state behaviour are unchanged. PWA shell geometry was not edited. Visual acceptance on a physical device remains unverified.

# Analyst target freshness correction — current

Quote freshness no longer controls whether a dated analyst target exists. Targets remain visible through older/missing quote states; comparison percentages are independently validated and labelled. Regression covers quote-state transitions and rendered fallback.

# Automatic analyst fallback — current

Overview now presents reported analyst consensus automatically when headline AURYN valuation is unavailable. Consensus-only data is explicitly labelled; no low/high target range or analyst count is manufactured. See `ANALYST_TARGET_FALLBACK.md`.

# Funded operating scenarios — current

Misleading forecast-multiple outputs are no longer headline valuations. A new explicit-assumption funded scenario workbench accounts for phased capex, financing, dilution and discounted equity. Missing future inputs are not fabricated. See `FUNDED_SCENARIOS.md` for scope and limits. Automatic sourced cases across all stocks, including ASTS, are not complete.

# Observed IREN response correction — current

Actual uploaded response now yields explicitly labelled price-anchored revenue sensitivities after independently corroborating trailing revenue. See `OBSERVED_IREN_SCENARIO_FIX.md`. NBIS/TE live response validation and ASTS framework/listing conflicts remain unresolved.

# Shared scenario pipeline corrections — current

Five reproduced selection/normalization/classification failures corrected with a 45-combination synthetic coverage matrix. See `SCENARIO_PIPELINE_CORRECTIONS.md`. This does not establish universal live ticker coverage; all reconciliation gates remain active.

# Visual Overview — current

Chart and scenarios are composed together, with key numbers and visible risk/context. The large diagnostic card grid has been removed. See `VISUAL_OVERVIEW.md` for exact scope and validation limits.

# Full Overview restored — 2026-10-19

Core financial metrics, evidence lenses and review thresholds are available in both modes. Metrics precede the chart; the depth selector sits with navigation on desktop and the decision heading on mobile. Repeated decision calculations reuse immutable evidence snapshots. See `OVERVIEW_DEPTH_AND_MODELS.md`.

# Current correction — 2026-10-19

Quote retention, compact first-screen decision snapshot, functional Simple/Pro depth and customer-facing source-link cleanup. See `REFRESH_CONSISTENCY.md`. PWA shell geometry is unchanged. Physical iPhone and authenticated live-feed checks remain unverified.

EVIDENCE-LED PRODUCT BUILD — 2026-10-19
Public storefront at /, fictional interactive walkthrough at /sample, separate signup at /login?mode=signup. Overview now layers business, conditional value, contribution condition, priority risk and dated evidence. Technicals includes monthly zone candles and an experimental robust candidate with equal-budget historical comparison. Original production policy, portfolio refresh/accounting and PWA geometry retained. Read docs/EVIDENCE_PRODUCT_BUILD.md for exact scope and limits. Candidate is not promoted as superior; five real-history checks have mixed results. No new SQL required. Final verification/report: 291 tests, 83 API checks, production build; no physical device/rendered browser confirmation.

Portfolio reliability update: older usable USD prices retain values across totals, rows, charts and exposure. Coherent background batches preserve last quotes after failure. Account-scoped on-device quote retention; Balanced (5 minutes), Live, Hourly and Manual controls. On-demand US sector benchmark comparison uses matching dates versus SPY and explicit missing history. No new SQL required beyond the earlier account-balances setup. Historical account returns are not reconstructed from current holdings. Verification details in REPORT.json; live provider and device visual verification unavailable.

Balance editor repair: readable independent form colours, compact two-column desktop/stacked mobile fields, comma-formatted USD entry without spinner or browser step errors, Save/Cancel. Existing margin and managed-balance database schema is unchanged; no additional SQL needed if setup already ran. 275 tests passed.

Account balances update: run docs/sql/ACCOUNT_BALANCES_SETUP.sql in Supabase SQL Editor. This seeds only Anudeep's $116,312 margin debt. The exact managed portfolio value remains unset; enter it via Portfolio > Edit margin & managed balance, excluding already listed holdings. Net equity is separate from gross assets and investment return. Quote timestamps are compact with full dates accessible. Verification: 274 tests, 82 API checks, production build. SQL tested locally, not applied live.

Desktop alignment update: research tabs no longer overlay content; portfolio columns and quote timestamps align; Advanced hero contrast corrected. Mobile ledger grid and PWA shell preserved. Tests: 269; fixture API checks: 77. Physical iPhone/browser visual confirmation remains unavailable.

> Latest: `INTERACTION_AND_TRUST.md` covers chart contrast, research-tab retention, Settings scrolling, evidence reuse and manual broker references. See interaction verification logs for the current check counts. Physical iPhone/rendered-browser acceptance is still outstanding.

> Latest Portfolio correction: `PORTFOLIO_LEDGER_REPAIR.md`. Replaces the conflicting mobile table with an isolated ledger, adds allocation/gain-loss charts and refines the editor. 265 automated tests; physical iPhone/rendered-browser acceptance remains unverified.

> Latest refinement: `PRODUCT_REFINEMENT.md` documents the price-clock fix, exposure-ranked Home, partial returns, compact layouts and Simple/Pro depth. Current logs: `verification/product-refinement-verify.log` and `verification/product-refinement-api.log`.

# Current release — connected research, 19 October 2026

Read **CONNECTED_PRODUCT.md** for the fifteen approved product points, their primary locations and their limits. This is the current scope; earlier dated reports in verification/ describe historical builds.

## Delivered source

- Separate opening business, valuation and entry assessments.
- Financials owns the business map and requested segment disclosures.
- News owns earnings preparation, actual-versus-estimate checkpoints and company updates.
- Research includes a lazy, bounded saved-company screener with explicit coverage.
- Portfolio includes classified shared exposures and an optional, explicit uniform stress assumption.
- Optional decision records connect to measured evidence and saved alerts.
- AI buttons send distinct allowlisted intents; optional bounded original SEC filing excerpts are source-linked.
- Existing accumulation, valuation, technical, professional risk, quote-trust and budget controls remain available.
- New styling is scoped; the PWA shell and safe-area implementation are preserved.

## Verification

`npm run verify`: 260 tests, generated route types, TypeScript and production build passed. Built API fixture results are recorded in verification/connected-product-api.log and REPORT.json. No paid API/model calls, broker orders or live database writes were made for this release.

## Activation and remaining acceptance

1. Apply/configure the existing shared budget migration before enabling the distributed market guard; see TRUST_AND_COST_CONTROLS.md.
2. Configure confirmed-account AI and its budget migration before generation. Optional SEC excerpts need SEC_USER_AGENT and AURYN_AI_FILINGS_ENABLED=true. See CONNECTED_PRODUCT.md.
3. Test deployed credentials, data entitlements, actual quote freshness, latency and AI citations with your accounts.
4. Validate the installed physical iPhone PWA, keyboard, safe areas, themes and every relevant viewport. This release did not run a physical device or rendered-browser acceptance test.
5. Commercial billing, market-data redistribution permissions, legal/operator details, security and support acceptance remain launch gates.

Licensed options/order flow, complete sector-specific intrinsic valuations, automatic interpretation of written theses and a globally shared streaming fanout are not implemented. No competitive superiority, complete stock coverage or investing-performance claim is made. This ZIP has not been pushed or deployed by the assistant.
