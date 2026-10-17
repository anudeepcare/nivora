# AURYN release status — 17 October 2026

**Full standalone source is included. Production acceptance is not complete.** The current update repairs the UI and reconciles financial-period selection following a signed-in audit of the deployed app. This patched source has not been deployed or tested on a physical iPhone.

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

See verification/REPORT.json, ui-repair-verify.log and ui-repair-api.log for final counts and commands. Unit/domain/Postgres checks, TypeScript and the optimized production build passed. Compiled-handler tests cover unauthenticated denial, trusted admin controls, crypto identity, SAP reporting currency, shared caching, mixed-provider selection, fallback labels, estimates and dated source links. The tests use fixtures and do not certify paid-provider availability.

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

The design contract is docs/design/approved-pwa-20261017.html. Review the source installer and Git instructions in DEPLOYMENT.md before replacement. The archive has a complete manifest and excludes secrets, installed dependencies and generated Next output. Any final source-review findings and fixes are recorded in verification/eodhd-review.md. No push, merge or deployment is implied by delivery of the ZIP.
