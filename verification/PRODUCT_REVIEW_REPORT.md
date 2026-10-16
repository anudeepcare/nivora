# Product research, financial integrity and mobile review

Reviewed October 15, 2026 in America/Chicago; logs use October 16 UTC. This is a complete updated source package, not certification of a finished commercial investment product.

## Implemented in this update

- SEC fact selection now preserves currency, unit, period start/end, filing date, accession, taxonomy, concept and source URL. Annual and standalone-quarter durations are validated; year-to-date figures are not silently presented as quarters. Restatements and source concepts are selected by current period and filing rather than the first matching tag.
- Derived amounts/ratios require compatible reporting periods and currencies. Total assets/liabilities cannot be replaced with current assets/liabilities. USD engine inputs remain unavailable when verified currency conversion is absent.
- Continuing operations and consolidated totals are distinguished. Incomparable predecessor periods remain visible with their currency but are excluded from current-business growth/durability calculations and the positive-year counts. Consolidated free cash flow is excluded from valuation when continuing-operations capital expenditure cannot be verified.
- The Business tab shows reported metrics, dates, source links, history and limitations. Financial durability is not labeled a moat. A moat claim requires resolvable dated source evidence; a numeric moat score additionally requires measured factor evidence.
- Overview explains the canonical new-money action, existing-position action and multi-year assessment. Model confidence is not described as a probability of profit. Tactical price invalidation is labeled as a setup level.
- Valuation discloses missing method implementation, inputs and independent validation. No new fair-value model, fabricated estimate or price-anchored substitute is added.
- Mobile research places decision context before the chart, enlarges key text, stacks evidence cards and gives technical timeframes/action levels separate readable cells. The approved blue/navy visual identity is retained.
- A bounded browser cache coalesces duplicate requests and reuses recent chart ranges across tab navigation. Independent abort subscribers and evidence clocks prevent one abandoned request or context refresh from corrupting another view's state. Old company responses are invalidated by an evidence-contract version.

## Regression evidence

The public NBIS SEC fixture reproduces the screenshot's reporting-basis problem. The former entity reported 2023 revenue of RUB 800.125 billion. The current USD annual revenue selected from the newer filing is USD 529.8 million for 2025. The fixture preserves both currencies and filing dates. For that current year, reported total net income is USD 82.5 million and continuing-operations net income is USD 9.8 million. Consolidated cash flow is not passed off as verified current-business free cash flow.

The fixture is a bounded public company-facts extract, not a live quote or a recommendation. The generic comparability safeguards do not interpret all merger/divestment footnotes. Filing review remains necessary where structured data cannot establish the business perimeter. No FX service or new subscription was added.

| Verification | Result | Evidence |
| --- | --- | --- |
| Current release acceptance | 657 passed, 0 failed, 0 skipped; 158 complete test files | `logs/product-acceptance.log` |
| New regression tests | 52 passed across four new test files | SEC 21; research clarity 15; request cache 13; valuation disclosure 3 |
| Production build, type checks and static generation | PASS | `logs/product-production-build.log` |
| Original historical aggregate | 649 passed, 82 failed; unchanged failure count | `logs/product-historical.log` |
| Current responsive browser review | 88 tab/theme/width cases and 8 request-reuse cases passed; 0 runtime errors | Local production build; intercepted services |

The build ran under Node 24.19.0 with locked Next.js 15.5.24 and public visual-test Supabase values. This build is for offline verification; deployment must rebuild with actual public configuration. Dependencies were already installed from the earlier clean package verification. This report does not describe the newer application source as freshly installed from its ZIP.

## Browser scope

The browser harness visits all eleven research tabs in light/dark themes at 320, 390, 430 and 1440 CSS pixels. It checks document overflow, runtime exceptions, the mobile decision/chart order, currency presentation, valuation disclosures, and chart request counts after tab reentry/range selection. It uses synthetic auth, quote/action/bar/timeframe fixtures and public SEC company facts. These tests do not validate vendor freshness, real authentication, investment performance, live brokerage or physical iPhone Safari behavior.

The request assertion expects one 3M and one 5Y fetch in each tested navigation case. The 5Y selected chart and long-term overview reuse a response. This is measured browser-request behavior, not a measured provider-bill reduction or field speed benchmark. No LCP/INP improvement or real-device FPS claim is made.

## Remaining product work and production acceptance

`PRODUCT_DIRECTION.md` gives the implementation sequence and affordability constraints. Company-specific moat research, independently validated valuation methods, a budget-aware adaptive DCA simulator, auditable diamond signals, discovery ranking and customer/live-trading expansion remain proposed work. Existing paper capabilities are preserved; no broker order, account setting, database migration or paid subscription was changed.

Earlier live checks and blockers remain in `LIVE_READINESS.md`. They were not rerun by this product review: manual paper audit table/admin setup and broker protections require configuration; actual login/CRUD and paper submission/fill/cancel need acceptance; extended-hours entitlement was unavailable. Model outcome evidence remains UNPROVEN. Data redistribution rights must be confirmed for customer launch under the owner's actual contract.

GitHub main was observed at `f6a08231a8dc7e1fff4dfc5f9772ce297ea88843`, containing the earlier rebuild. This new product review source has not been pushed or deployed by this session. A source archive is not a Vercel production deployment.

Manual visual inspection included light/mobile Overview, light/desktop Business, dark/mobile Business and dark/desktop Technicals. The 12 new `product-` screenshots are included. Wide financial-history tables scroll inside their labeled region; the document does not overflow. The fixed bottom dock appears partway down full-page screenshots because its position is relative to the captured viewport.
