# AURYN release status — 17 October 2026

**Full standalone source is included. Production acceptance is not complete.** The current update implements both-provider routing and the approved research layout. It has not been deployed or tested on a physical iPhone in this session.

## What changed

- Twelve Data preferred quotes/intraday plus EODHD financial research/daily history; sequential price fallback with explicit provenance and shared request caching.
- EODHD company identity, annual/quarterly financials, 31-metric financial catalog, TTM processing, market multiples, consensus, estimates, earnings, institutional/insider ownership, holder records, reported insider transactions, profile/logos, news, SEC filings, dividends and splits. Availability differs by ticker; unavailable raw fields are not invented.
- Five research tabs using the approved design tokens: Snapshot, Financials, Valuation, Technicals, Thesis. Compact data charts, financial bull/bear evidence, visible amount-free DCA, expanded technical studies and working help dialogs.
- ADX/ATR/OBV/relative volume/Bollinger measures, completed daily/weekly studies, Fibonacci reference levels and monthly DCA history. The existing 0×–4× policy remains experimental and price based; it is not a validated fundamental recommendation.
- Replaced the old global stylesheet with the approved style foundation and application layout rules. Desktop sidebar, four-item mobile dock, safe-area padding, reduced motion and light/dark/system preferences. A service worker provides a network-first offline page and does not cache private/API/market responses or force page reloads.
- Existing account-gated workspace, portfolio/watchlist, alerts, scenario tools, historical comparisons and guarded paper plans are retained. Removed primary-UI panels stay removed. No new database migration or automatic trade was performed.

## Verification for this update

See verification/REPORT.json, eodhd-verify.log and eodhd-api.log for final counts and commands. Unit/domain/Postgres checks, TypeScript and the optimized production build passed. Compiled-handler tests cover unauthenticated denial, trusted admin controls, crypto identity, SAP reporting currency, shared caching, mixed-provider selection, fallback labels, estimates and dated source links. The tests use fixtures and do not certify paid-provider availability.

The new adapter also parsed the official public AAPL demo into 3,447 normalized financial observations, 50 estimate records, 20 earnings records and 12 holder records. This validates the retrieved response shape against the adapter, not the paid account, accuracy of each field or full watchlist coverage.

Earlier live read-only Twelve Data/SEC/Finnhub/Alpaca probes and database setup evidence are retained in verification/. They predate this update and do not substitute for new deployed end-to-end checks. The connected database setup and 31 prior rollback-only checks are documented in verification/LIVE_SETUP.md.

## Still unverified

- **Paid EODHD connection:** the user says the key is configured externally. No EODHD key was available locally; Vercel environment access returned a scope authorization error. This is an access blocker, not evidence of a bad key. Check actual preview research responses for the intended tickers.
- **Actual rendered UX and installed iPhone PWA:** no supported browser-control capability was available in the managed Sites environment. The Sites workflow disallows an improvised browser path. Therefore no pixel comparison, touch/keyboard journey, contrast measurement, all-viewport pass or physical-device acceptance is claimed. The approved HTML is a design reference, not an actual screenshot of this build.
- **Deployed account flows:** registration, reset, owner mapping and authenticated writes through the new deployed UI require preview acceptance. Current database/RLS tests do not establish that end-to-end journey.
- **AI:** no AI key/model and funded runtime were verified; no paid generation took place. EODHD does not supply this service. Deterministic financial evidence is available independently.
- **Paper execution:** no order submission, partial fill/cancel lifecycle or deployed scheduler was exercised. Execution/scheduling are off by default.
- **Commercial operation:** personal subscriptions are not verified resale licences. Multi-instance cache/budget, real traffic latency, billing and support operations remain open.

## Material inherited scope still incomplete

The 104-item audit in requirements-inherited.json remains authoritative for inherited requirements. This update does not claim completion of all of them. Remaining capabilities include automatic source-backed qualitative moat/management due diligence; segment/KPI/transcript ingestion; guidance-to-actual tracking; a persisted canonical assessment propagated to every screen/order; fundamentally conditioned personalized DCA and validated strategy promotion; a full transaction ledger, realized/benchmark-adjusted performance and automatic corporate-action reconciliation; options/gamma/flow data; material-change briefings and broad thesis alerts; point-in-time survivorship-aware walk-forward validation; and commercial billing. A few hundred financial numbers or a successful build do not establish those capabilities.

## Review and delivery

The design contract is docs/design/approved-pwa-20261017.html. Review the source installer and Git instructions in DEPLOYMENT.md before replacement. The archive has a complete manifest and excludes secrets, installed dependencies and generated Next output. Any final source-review findings and fixes are recorded in verification/eodhd-review.md. No push, merge or deployment is implied by delivery of the ZIP.
