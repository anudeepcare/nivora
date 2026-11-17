# Financial normalization validation — 27 October 2026

This work repairs deterministic period selection, comparable TTM construction and capitalization dating. It validates software behavior against controlled fixtures. It does not independently verify live provider values, calibrate investment thresholds or establish investment performance.

## Changes and contracts

- `financialPeriods` validates actual start/end dates and duration before treating a scope label as an annual or quarterly observation. Annual spans are 330–400 inclusive days; quarterly spans are 60–110 inclusive days. These are normalization bounds, not return-prediction thresholds. Short transition periods remain in raw facts and are not extrapolated into annual results.
- Same-end alternatives are ordered deterministically by available core fields (revenue, operating income, net income, operating cash flow, capex and calculated FCF), accounting basis, filing date and stable currency/basis/start/source tie breaks. Each end/currency/accounting-basis series exposes one selected period. Completeness is a selection rule, not an assessment of business quality. Raw observations are retained for source/conflict inspection.
- The latest reporting observation prefers the explicit reporting currency among observations with the newest end. It does not choose an older quote-currency year over a newer reporting-currency year. Prior-year comparison still requires a 330–400-day end-date gap and the same currency and accounting basis. Memoization includes the currency preference.
- Financial amount fields require the exact period currency as their unit. Per-share facts cannot become revenue or balance-sheet amounts. Weighted share counts require shares units; EPS requires currency/share units. Zero and negative reported amounts retain their meaning. Margins below −100% are not clamped.
- TTM windows are constructed within currency/accounting-basis series. Four quarters must be exactly contiguous, with no missing or double-counted days. Flows are summed only when all four values exist. Closing balances come from the final quarter. Weighted average shares are weighted by each quarter's inclusive day count; TTM EPS remains unavailable rather than summing split-sensitive EPS observations. Derived-quarter source URLs are retained.
- `metricEvidence` scopes provenance and disagreements to the selected currency, accounting basis, actual flow period and units. A same-end quarterly observation cannot fill a missing annual amount. TTM provenance includes every contributing quarter and derived source. Only the latest filing revision for each metric/period participates in current conflict checks; genuine same-revision disagreements remain conflicting. Parallel currencies or accounting bases are separate evidence, not financial conflicts.
- New `listingReconciliation` accepts only explicit field observations with identical economic timestamps, one quote currency, positive finite values and the same listed-share identity. A supplied snapshot price can reconcile an older cap/share snapshot after today's quote moves. `General.UpdatedAt` is never treated as the date of individual financial fields. Missing/misaligned observations produce `missing`, not `conflicting`. The existing 10% difference tolerance applies only to genuinely comparable observations; it is a consistency heuristic, not a validated error probability.
- Additive `EodEvidence.listingObservations` contains `marketCap { asOf, currency, shareBasis }`, `shares { asOf, unit: "shares", shareBasis }` and optional `price { value, asOf, currency, shareBasis }`. No provider metadata is fabricated to populate these fields. `shareBasis` must identify the selected company symbol.
- `researchBrief.listing` exposes reconciliation status, detail, matching reference price/date and percentage difference. `researchBrief.conflicting` continues to expose a proven listing conflict for compatibility. Reported operating figures and earnings-multiple scenarios remain available because they do not use aggregate cap/share amounts. Share-dependent revenue scenarios require the listing bridge. Consumers must scope this flag to dependent calculations rather than hide all financial evidence.
- `researchBrief.scenario` adds `years` and `annual { low, base, high }`. Earnings sensitivity remains EPS multiplied by a disclosed P/E assumption; it is not intrinsic fair value. The scenario horizon and forecast-age checks use `priceObservedAt ?? retrievedAt`. Quote dates are checked even if a persisted `stale` flag still says false.
- Revenue sensitivity cash/debt pairs additionally require instant scope, matching currency units and accounting basis, alongside the existing date/accession and nonnegative-value checks. Same-date observations use a stable filing/accession tie break. The IREN fixture has slightly different annual and quarterly cash amounts; the deterministic quarterly tie break uses 5,895,600,000 rather than 5,895,591,000. This is source selection, not independent reconciliation of the actual company's statements.

## Formulas inspected

| Metric | Calculation and safeguards |
| --- | --- |
| Free cash flow | Operating cash flow − absolute capex. Same period/currency/accounting basis, accession and filing date. No replacement of missing inputs by zero. |
| Operating/gross/net/FCF margin | Corresponding amount ÷ positive revenue × 100. TTM ratios are recalculated from summed flows. |
| SBC/revenue and capex/revenue | Stock compensation ÷ positive revenue × 100; absolute capex ÷ positive revenue × 100. |
| Revenue growth | (Latest revenue ÷ prior positive revenue − 1) × 100, using comparable period/currency/accounting basis. |
| FCF per weighted share | FCF ÷ positive weighted average shares; SBC-adjusted variant subtracts SBC from FCF first. |
| Current ratio, debt/equity, interest coverage | Current assets/current liabilities; debt/equity; operating income/interest expense. Denominators must be positive and finite. These ratios alone are not sector-specific solvency conclusions. |
| Net debt and cash conversion | Debt − cash; operating cash flow ÷ positive net income. Negative earnings do not become a positive conversion ratio. |
| Quarter derivation | Later cumulative flow − earlier cumulative flow with matching metric/start/unit/currency/basis and available filing dates. EPS and weighted average shares are not derived by subtracting cumulative values. |
| Capitalization difference | (Reported capitalization ÷ (matching shares × matching price) − 1) × 100, only for comparable observations. |
| Earnings targets | Low/base/high positive annual EPS × forward P/E × 0.8/1.0/1.2. Those multiples are disclosed sensitivity assumptions. |
| Revenue targets | max(0, forecast revenue × exit EV/revenue − net debt) ÷ (shares × (1 + assumed dilution)). Existing 20%/10%/0% cumulative dilution assumptions remain unchanged and uncalibrated. |
| Scenario total return | (Target/reference price − 1) × 100. |
| Scenario annual return | ((Target/reference price)^(1/years) − 1) × 100; years = actual forecast-date distance from the assessment clock ÷ 365.25 days. No fixed three-year division. |
| Five-year cash-flow sensitivity | Five annual per-share cash flows discounted individually, plus a terminal value. Shares compound by annual dilution. Terminal per-share growth = (1 + terminal cash growth)/(1 + dilution) − 1. Invalid discount/terminal/cash/share inputs are rejected. Existing assumptions were inspected, not changed or certified. |
| Reverse growth | Bisection over the existing −70% to 100% cash-growth range to match the stated price under fixed discount/terminal/dilution assumptions. A solver result is not a forecast. |
| USD portfolio totals | Sum known positive price × quantity only for compatible USD observations; missing prices or foreign/unknown cost currencies withhold aggregate P&L. Unchanged. |

RSI, moving averages, ATR percentage, Fibonacci ranges and volume ratios in `analysis.ts` were inspected for units: they remain descriptive price calculations. This task did not alter their study definitions or claim predictive validation. Pace has a separate validation task.

## Tests actually executed

Regression tests were written and observed failing before the corresponding behavior changes. `tests/financial-normalization.test.mjs` now contains 19 controlled cases covering tied-end ordering, duplicate chart dates, malformed/short annual periods, parallel currency/basis TTM, amount-versus-per-share units, undated/stale/same-time capitalization comparisons, independent earnings scenarios, scenario horizons and quote clocks, balance unit/basis/scope mismatches, exact TTM continuity, preservation of existing invalid numeric guards, and metric-level provenance/period/revision selection.

Final focused command:

```sh
node --experimental-strip-types --test \
  tests/financial-normalization.test.mjs tests/engine.test.mjs \
  tests/research-depth.test.mjs tests/financial-workspace.test.mjs \
  tests/research-brief.test.mjs tests/research-integrity.test.mjs \
  tests/outlook.test.mjs tests/revenue-outlook.test.mjs \
  tests/research-summary.test.mjs tests/decision-research.test.mjs \
  tests/financial-explorer.test.mjs tests/advanced-research.test.mjs \
  tests/approved-research.test.mjs
```

Result: **97 tests passed, zero failed**. Whole-suite, TypeScript, build and browser results belong to the integrated release checks, not this focused run. An earlier integration probe exposed the old `edge-ui.test.mjs` expectation that undated capitalization mismatches must cause “Evidence needed”; the decision owner was informed to update that expectation with the unified decision policy.

Follow-up integration checks: the 45-case `scenario-shape-matrix.test.mjs` preserves complete, missing-EPS and incomplete-nearer forecast coverage across three provider shapes and five business types. Each case first verifies that normalization does not invent cap/share dates. Clearly labelled synthetic field observations then exercise the supported scenario path. Available cases also reject future provider dates, future quotes and out-of-horizon forecasts; share-dependent cases reject mismatched dates, future cap dates, currency mismatches and ADR-basis mismatches. The focused scenario/integrity command (matrix, scenarios, funded scenarios, price-risk scenarios, outlook, revenue outlook, normalization and research integrity) passed **105 tests, zero failed**. Four added metric-provenance regressions were individually observed failing before the production correction.

## Material limits

The unmodified uploaded IREN fixture does not contain field-specific cap/share dates; its revenue scenario is now withheld with an explicit evidence reason. Its operating financial facts and analyst target remain available. A clearly labelled synthetic extension supplies comparable dates solely to regression-test calculated EV/revenue arithmetic and invalid-unit guards. That extension is not asserted to be an actual observation.

The current fundamental normalizer does not invent `listingObservations` from a dataset update timestamp. Consequently, real share-dependent revenue cases require a source that provides this explicit bridge before becoming available. Foreign listings still require explicit listed-share/ADR reconciliation. No FX, share-class conversion, split adjustment, implied missing statement field or independent valuation is invented. The 10% capitalization/EV-revenue checks and 20% EV consistency check remain heuristics; no newly validated threshold, investment accuracy, or return advantage is claimed.
