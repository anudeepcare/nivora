# Latest reliability corrections

See verification/SEARCH_LOGO_REQUEST_RELIABILITY.md. 150 tests and 60 simulated API checks pass. Live deployment access was denied; installed-iPhone defects remain unresolved pending device verification.

# Latest evidence restoration

See verification/EVIDENCE_RESTORATION.md. 150 tests and 59 simulated API checks pass. Universal valuation models, private entitlement verification and rendered/iPhone acceptance remain open.

# Latest iPhone PWA corrections

See verification/MOBILE_PWA_CORRECTION.md. 150 tests and 58 simulated API checks pass. Physical iPhone acceptance remains open.

# Latest screenshot corrections

See verification/MOCK_PARITY_CORRECTION.md. Latest verification: 148 tests and 58 fixture API checks passed. Exact rendered parity remains unverified.

# AURYN release status — 17 October 2026

**Full standalone source is included. Production acceptance is not complete.** The current update repairs the UI and reconciles financial-period selection following a signed-in audit of the deployed app. This patched source has not been deployed or tested on a physical iPhone.

## Current update — approved studio build

The approved top navigation, research canvas, floating mobile dock, compact settings and exact primary metric set are implemented. Additional primary forecast/ownership/news/dividend/repeated earnings grids were removed from the five research views. Outlook cases remain disclosed forecast sensitivities; their actual horizon and eligibility differ from illustrative mockup targets. The user-approved reference is `design/approved-studio-20261017.html`. All 146 domain/UI tests, typecheck, production build and fixture-backed API suites pass. Two independent-review findings (slow-loading scroll and expired consensus fallback) were fixed with RED→GREEN tests. Read `../verification/APPROVED_STUDIO_REPORT.md`. Rendered parity, installed-iPhone PWA behavior and new authenticated live checks remain unverified.

## Previous update

The latest correction moves account/session and shell ownership into the persistent root layout; preserves primary-tab positions and list filters; reduces mobile holdings density; puts allocation after holdings; and stabilizes quote-status changes. APP screenshot repairs correct the valuation-axis geometry and calculator labeling. Earnings-quality checks distinguish positive net income from an operating loss; debt context no longer becomes an automatic bear argument. See verification/RESEARCH_MOBILE_REPAIR_20261017.md. Company-specific valuation models remain incomplete; the research terminal contract is in RESEARCH_TERMINAL_SPEC_20261017.md.

The current source replaces the oversized research takeaway with a compact financial/action summary and explicit conditional buy/hold/trim/sell-review labels. These are original research prompts, not company-specific fair value or executable orders. Current quotes alone cannot validate an obsolete trend; unknown business classification blocks ordinary-company action labels. DCA now shows all 0×–4× zones, six confirmed months and the forming month, with price-only context. See DECISION_GUIDE.md.

Sector/industry metadata now guards bank, insurer, REIT/property and other financial models. Shared Help dialogs no longer generate invalid paragraph nesting; search navigation/ARIA/scrolling, dialog safe areas, mobile holdings, no-match filters and stale comparison results were repaired. Latest TTM/annual labels are consistent in Discover, Compare and AI evidence. The all-route source audit and authenticated reference scope are in verification/UI_CONTROL_AUDIT_20261017.md and verification/REFERENCE_REVIEW_20261017.md.

## Latest repair and evidence

Read verification/LIVE_UI_AUDIT_20261017.md for the live audit and HIMS/ValueSnapshot reconciliation. The source now uses current complete TTM evidence consistently, removes generic calculator-driven buy/valuation judgments, corrects zero P/E and forecast displays, preserves account data between navigations, batches portfolio totals, and repairs mobile header/holdings/search/allocation layouts. Provider metadata is in Data details. The cash-flow calculator is an assumption sensitivity, not a company-specific fair-value engine.

## What changed

- Twelve Data preferred quotes/intraday plus EODHD financial research/daily history; sequential price fallback with explicit provenance and shared request caching.
- EODHD company identity, annual/quarterly financials, 31-metric financial catalog, TTM processing, market multiples, consensus, estimates, earnings, institutional/insider ownership, holder records, reported insider transactions, profile/logos, news, SEC filings, dividends and splits. Availability differs by ticker; unavailable raw fields are not invented.
- Five research tabs using the approved design tokens: Snapshot, Financials, Valuation, Technicals, Thesis. Compact data charts, financial bull/bear evidence, visible amount-free DCA, expanded technical studies and working help dialogs.
- ADX/ATR/OBV/relative volume/Bollinger measures, completed daily/weekly studies, Fibonacci reference levels and monthly DCA history. The existing 0×–4× policy remains experimental and price based; it is not a validated fundamental recommendation.
- Replaced the old global stylesheet with the approved style foundation and application layout rules. Desktop sidebar, four-item mobile dock, safe-area padding, reduced motion and light/dark/system preferences. A service worker provides a network-first offline page and does not cache private/API/market responses or force page reloads.
- Existing account-gated workspace, portfolio/watchlist, alerts, scenario tools, historical comparisons and guarded paper plans are retained. Removed primary-UI panels stay removed. No new database migration or automatic trade was performed.

## Verification for this update

See verification/REPORT.json, research-correction-verify.log and research-correction-api.log for current counts and commands. Compiled-handler tests cover unauthenticated denial, trusted admin controls, crypto identity, SAP reporting currency, shared caching, mixed-provider selection, fallback labels, estimates and dated source links. The tests use fixtures and do not certify paid-provider availability. The earlier decision-ui logs describe the preceding source version.

The new adapter also parsed the official public AAPL demo into 3,447 normalized financial observations, 50 estimate records, 20 earnings records and 12 holder records. This validates the retrieved response shape against the adapter, not the paid account, accuracy of each field or full watchlist coverage.

Earlier live read-only Twelve Data/SEC/Finnhub/Alpaca probes and database setup evidence are retained in verification/. They predate this update and do not substitute for new deployed end-to-end checks. The connected database setup and 31 prior rollback-only checks are documented in verification/LIVE_SETUP.md.

## Still unverified

- **Paid EODHD connection:** the deployed UI returned EODHD financial/consensus data for APP, HIMS, SAP and OSCR and historical charts during the live audit. The key was not accessed locally, and the full subscription entitlement matrix remains unverified.
- **Patched rendered UX and installed iPhone PWA:** the deployed predecessor was inspected through the cloud browser and the supplied iPhone screenshots. Local preview control is unavailable under the managed Sites workflow. Post-repair pixel comparisons, all-viewport checks and physical iPhone acceptance are therefore still required; no exact visual match is claimed.
- **Deployed account flows:** secure sign-in and reading existing portfolios/watchlists succeeded on the deployed predecessor. Registration, reset, account writes and patched navigation still require preview acceptance.
- **AI:** the deployed UI reports generation disabled. No paid generation or configuration change took place.
- **Paper execution:** the signed-in account encountered Administrator access required. Trusted owner/admin mapping must be checked; no permission change or broker order was made.
- **Commercial operation:** personal subscriptions are not verified resale licences. Multi-instance cache/budget, real traffic latency, billing and support operations remain open.

## Material inherited scope still incomplete

The 104-item audit in requirements-inherited.json remains authoritative for inherited requirements. This update does not claim completion of all of them. Remaining capabilities include automatic source-backed qualitative moat/management due diligence; segment/KPI/transcript ingestion; guidance-to-actual tracking; a persisted canonical assessment propagated to every screen/order; fundamentally conditioned personalized DCA and validated strategy promotion; a full transaction ledger, realized/benchmark-adjusted performance and automatic corporate-action reconciliation; options/gamma/flow data; material-change briefings and broad thesis alerts; point-in-time survivorship-aware walk-forward validation; and commercial billing. A few hundred financial numbers or a successful build do not establish those capabilities.

## Review and delivery

The current design foundation is docs/design/approved-studio-20261017.html. Earlier design references are historical. The compact action/DCA summary is the current request’s source refinement; it has not been accepted through a rendered comparison. Review the source installer and Git instructions in DEPLOYMENT.md before replacement. The archive has a complete manifest and excludes secrets, installed dependencies and generated Next output. Any final source-review findings and fixes are recorded in verification/eodhd-review.md. No push, merge or deployment is implied by delivery of the ZIP.
