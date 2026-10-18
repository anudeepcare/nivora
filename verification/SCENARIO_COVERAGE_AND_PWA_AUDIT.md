# Scenario coverage and installed-PWA audit

## Live observations, prior to source changes
- HIMS: financial data and consensus present; model explicitly withheld cases because low/base/high EPS was not complete, ordered and positive.
- NU: model explicitly withheld cases because its sector-specific valuation gate blocked bank scenarios.
- SAP: EUR financial statements displayed against a USD listing; model explicitly withheld cases because no comparable annual EPS forecast in quote currency was available.
- These are different coverage failures, not one missing CSS panel. The new source has not been deployed by this session.

## Scenario changes
- A complete eligible positive EPS range is selected before choosing the nearest available horizon, rather than selecting a record that may have invalid inputs while another valid record exists.
- Eligible bank EPS cases are earnings/multiple sensitivities only. No operating cash-flow valuation is applied; capital adequacy, credit losses and book-value assessment remain separate and unimplemented.
- Infrastructure and eligible companies without usable EPS can use a separately labelled revenue sensitivity. Formula: (annual forecast revenue × exit EV/revenue − current net debt) / diluted outstanding shares. Case stresses use 80/100/120% of the reported multiple and 20/10/0% additional dilution. These are explicit assumptions, not observed future dilution.
- Outstanding shares are retained from the existing fundamentals response; cash and debt must match period, accession and currency and be dated. No additional fundamentals request is introduced.
- Foreign-domiciled revenue cases require matching reporting currency plus market-cap/share/price consistency within 10%. This is a consistency screen, not independent verification of ADR ratios or corporate actions. Foreign per-share EPS is not assumed reconciled.
- Insurance-specific fair value, cross-currency/ADR conversion and funded infrastructure capacity/capex scenarios are NOT implemented. Revenue cases hold current net debt constant, omit future financing/capacity conversion and are not intrinsic fair values. They can materially overstate or understate equity value.
- No claim that every actual ticker will have eligible data or numerical cases. Unit fixtures are synthetic, not live NBIS/IREN/HIMS/NU valuation validation. Missing inputs are not fabricated.

## Performance and PWA source changes
- Twelve Data fetches now opt into server Data Cache using dataset-specific durations; quotes 30s, intraday60s, daily3600s, profile86400s. Account/API responses remain private; no service-worker market cache.
- Visual viewport event writes coalesce through animation frames, skip unchanged style values and cancel pending frames on unmount.
- Search keyboard selection scrolls only its results container instead of scrollIntoView on all ancestors. Search-clear and research-tab focus use preventScroll. This removes a concrete source of ancestor/page movement; it is not installed-device proof.
- Help includes an opt-in Device layout diagnostics disclosure. It captures only viewport/control geometry and standalone status; no account, holdings, tokens or page content.

## Verification
165 tests, TypeScript and production build passed. 61 built-handler fixture API checks passed. No private provider tokens or real broker orders were used by tests. No post-change production latency benchmark, browser screenshot comparison or physical installed-iPhone Safari test. Source not pushed/deployed. Production readiness is not established.

## Method references
- https://pages.stern.nyu.edu/~adamodar/New_Home_Page/dam2ed.htm — enterprise/revenue multiples and equity/firm distinction. This does not validate AURYN assumptions or targets.
- https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds — available fundamentals, share statistics and forecasts; actual coverage varies.
