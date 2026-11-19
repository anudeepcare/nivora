# IREN metrics, DCA and targets audit — 8 November 2026

## Baseline and changes
Read-only remote verification found preprod 7829f437786eb92e08201e88c9f9a820ba1fa402. Its changes since 1bb2bd8 match the previous delivered core-scenario ZIP. All those files are preserved in this handoff. No push, deploy or production change was performed.

The user screenshot was inspected as actual image pixels. It shows eight visible company metrics plus an All research metrics disclosure. Removed that disclosure: the existing business, valuation, technical and ownership evidence grid now renders directly, while respecting saved category preferences. The inactive position-size control remains removed.

Analyst target cards now show the dataset observation date and exact comparison reference date/basis, with an explicit statement that individual target revision dates and horizon are not supplied. Fixed a stale-label bug: a discarded stale quote no longer makes the selected recent settled-close reference appear stale. Added regression coverage. Existing low/consensus/high rendering remains conditional on authentic supplied ordered range fields; no inferred analyst low/high values or invented analyst counts.

## What the examples demonstrate
The supplied DCA Optimizer screenshots show third-party analyst ranges and a separate technical-only DCA badge. HIMS: quote 26, low 23, consensus 31.15, high 42. IREN: quote 21.64, low 23, consensus 61.34, high 139. ASTS: quote 32.33, low 42.50, consensus 74.68, high 108. NBIS: quote 129.49, low 84, consensus 278.05, high 410. These are screenshot observations, not current Auryn provider payloads; they have not been hardcoded or represented as verified Auryn data. A lowest analyst target above today's price does not establish a downside floor.

Auryn's ingestion maps AnalystRatings.TargetPrice, TargetPriceLow and TargetPriceHigh when present. The archived authentic IREN response contains consensus 77.8056 but no low/high. It is dated October 19, not the screenshot's November observation. Different provider coverage and dates cannot be reconciled by copying screenshot numbers. The revenue sensitivities added previously remain explicitly separate conditional calculations, not analyst forecasts or fair value.

## Financial metric audit
Traced source field mapping, financial period selection, currency separation, trailing-four-quarter aggregation and displayed metric formatting. Operating cash flow maps totalCashFromOperatingActivities; free cash flow subtracts capex; net debt subtracts cash from interest-bearing debt. The screenshot displays AUD figures for September 2026 and a provider-reported forward P/E 137x. This multiple has no supplied EPS denominator horizon/accounting basis and is not evidence of cheapness or an independently validated valuation.

The available authentic October IREN archive instead selects the June 2026 USD annual revenue of 707M and comparable prior USD revenue 501.023M, giving 41.1113% growth. It does not contain the current September cash-flow inputs required to reproduce screenshot values. These different periods/currencies must not be substituted for one another. The screenshot's 0.9% growth, -166.5% margin, A$2.5B operating cash flow and -A$1.3B free cash flow are NOT certified as accurate by this audit. Exact current provider statement rows with dates/currencies, or authenticated access to the same current response, are needed to verify them. No financial values were guessed or silently changed.

## DCA audit
60 focused checks passed, including 589 stored v6 classifier predictions. Current P1 blocks additions after historical P4; forming P4 cannot increase a confirmed P2 contribution; P0/P1 and business/data gates block contribution sizing. P2/P3/P4 map to 1x/2x/up-to-4x of planned contribution subject to budgets/caps. Price zones are separate from business eligibility and analyst targets.

No proven DCA algorithm error was found, so the algorithm was preserved. The archived real IREN response has no price history and correctly produces no Pace reading and a Review assessment. Existing history fixtures cover APP/AVGO/ALAB; they are not live IREN evidence. Current IREN versus another site's technical badge cannot be certified without matching dated price histories and policy definitions.

## Validation and limits
Full local suite: 1,308 passed, zero failed/skipped. Focused rendering/target tests: 93 passed. Lint and typecheck passed. Final build and format results are recorded in the delivery message. The previous authenticated browser session belongs to an older immutable deployment; the latest hostname requires a separate app sign-in. New deployed behavior and small-screen interaction are not claimed as verified. No provider access, data entitlement, permanent permission or production database change was made.
