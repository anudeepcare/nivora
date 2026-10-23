# Current continuation — 23 October 2026

Read `docs/LAUNCH_DESKS_AND_PRICING.md` and `docs/LAUNCH_AUTH_SETUP.md` first. This revision adds launch authentication/routing, new Value/Advanced presentation, a new explicit operating-expectations engine, mobile metric fixes and extended-hours request/freshness repairs. Full source retains monthly-v4 and portfolio data logic. Verification results are in `verification/REPORT.json`; earlier counts below are historical. No push/deployment or live database mutation was performed. Live OAuth, extended-hours entitlement and physical iPhone/rendered-source acceptance remain outstanding.

# Current source changes and acceptance blockers

This note supersedes earlier release-completion summaries. The source archive for this continuation includes the changes below and monthly v4. No Git push or deployment was performed. It is not a certification of full production acceptance.

## Latest supplied references

All eight user screenshots from 11:06:38 PM through 11:10:55 PM on October 22 were inspected directly. These show Business utilities, Financials funding rows, three Value accordions, News led by earnings tables, three public-page sections and the static Home concentration/drawdown selection. Originals were not changed or added to source.

## Changes in source

- Overview and Technicals now lead with the current forming accumulation reading when available. The settled date, provisional state, reason, active band and Technicals price levels use the same selected reading. The last confirmed result remains separately labelled; confirmed historical frequency and simulations remain based on completed periods. Monthly calculations now use v4, described below; weekly v1 remains separate.
- Reproduced whole-screen “Opening research…” flashes in signed-in Business and Advanced. Next dynamic panels without a loading option propagated suspension to the parent Research boundary. Advanced now has a local loading boundary; the unused Business decision-record block and its lazy import were removed. A streaming regression with the actual Next loadable implementation retains company identity and navigation during deferred panel loading.
- Business combines generic research questions inside the optional company description and collapses revenue-by-business/region into a compact disclosure. Opening it loads the existing cached breakdown; no extra data subscription or new endpoint. Stored private research records were not deleted.
- Financials funding measurements use a compact responsive tile grid, retain the available numeric fields and put lengthy calculation explanations behind one disclosure. Financial explorer selection starts with Essentials rather than Cash flow. Reported EPS period dates use the shared date formatter.
- Value retains the result, published multiples and one compact model-basis disclosure. Personal operating and sensitivity editors moved to Advanced > Valuation tools and mount when that section is visited. Existing controls and calculations are preserved.
- News opens with headlines and filings, then scheduled events and reported transactions. Full historical EPS and forecast tables remain available in a secondary disclosure.
- Home replaces the permanent two-check primary section with up to three dated observed moves ranked by estimated price-reference impact on current holding units. Lots are combined; foreign, missing, invalid, future and more-than-four-day-old quote observations are excluded. This is not account daily P&L or a trading instruction. If no move is eligible, explicitly labelled concentration/cost checks remain as fallback. The selected companies change only when supplied prices or holdings warrant it; no fabricated rotation.
- Home headline selection matches company names or explicit ticker notation and gives different companies space before repeated stories. Regression excludes NowVertical and Primis stories misassociated with ServiceNow. Headline matching is heuristic, can omit relevant broad stories and does not independently establish materiality. No additional provider calls.
- Removed the large blue Analysts summary fill; retained coloured consensus and recommendation bars, readable light/dark tokens and existing shell/PWA geometry.

## Monthly comparison and remaining limits

Production monthly v4 matches all 26 confirmed/forming readings inspected across 13 stocks, versus 19/26 for v3, and all 26 supplied IREN historical months. Eight current stocks and the IREN history were calibration inputs; five additional stocks were inspected afterward without retuning. This is measured selected-sample agreement, not the private reference formula or a guarantee for other stocks/dates. No ticker overrides, private endpoints or competitor bulk downloads were used.

Read `MONTHLY_POLICY_V4.md` and `verification/monthly-v4-reference-audit.json`. The rules, comparison table and historical outcomes are disclosed. Equal-budget v4 outcomes: 3 ahead, 2 behind and 7 equal to fixed monthly purchases among 12 eligible stocks; NBIS has insufficient execution history. No investment edge is established. Weekly IREN remains 3/3 versus reference 4/4. Broad parity remains unproven.

## Verification

419 automated tests passed; route type generation, TypeScript and optimized production build passed. All 83 compiled API fixture checks passed. Logs: verification/monthly-v4-verify.log and verification/monthly-v4-api.log. git diff --check passed.

Signed-in Chrome inspected the deployed public pages, Home and IREN Overview, Business, Financials, Value, Technicals, Analysts and News, and reproduced the first-load Advanced suspension. That deployment predates this source patch. Current patched-source rendered visual acceptance and physical installed-iPhone PWA acceptance are not established. Public-page screenshots 5–7 were inspected; their visual direction was not replaced by an unapproved redesign.

Full release acceptance remains blocked by weekly/broader numerical parity and desktop/iPhone visual acceptance. Do not describe this source as the requested final production-ready delivery.
