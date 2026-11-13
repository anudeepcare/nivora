# Decision-gate audit and correction — 13 November 2026

## Scope and source

This is a new source release based on the exact `AURYN-portfolio-target-freshness-20261113.zip` input (SHA-256 `68ad33f71d2b372077e3ce43f34c76e3c08306d91a23d2be4625a3e8855e2916`). All four supplied screenshots were materialized and inspected as pixels. The authenticated preproduction Research pages for NBIS, IREN, NVDA and NOW were inspected without refreshing paid data or changing account records. No push, deployment, database migration, provider subscription or paid service was performed.

## Root causes

1. A November 10 historical-cohort override changed any unsupported business with an operating loss and negative free cash flow into Avoid/Reduce. This conflated expansion spending and incomplete qualification with operating liquidity distress. The separate existing funding screen correctly distinguishes operating cash flow from cash after capex, but the new override bypassed that distinction.
2. A second override vetoed all supported P2–P4 accumulation after a drawdown of 30% or more. It applied even to funded-growth firms outside the passing-business cohort used in the displayed comparison. The code said to wait for the fall to steady but never measured stabilization.
3. A third override produced Buy/Add in P1 for an uptrend. That contradicted the established P1 Watch/Hold policy, while the formatter silently displayed Watch/Hold anyway. It has been removed, not exposed as a new purchase rule.
4. The primary card displayed the provisional price zone but omitted the decision's shallower eligible zone beside its headline. NVDA's Watch beside provisional P2 was particularly confusing.
5. Historical cohort matching accepted missing growth/dilution as a complete pass and accepted unchecked history dates. Cohort context could also remain current-looking after a cached snapshot aged.

## Live observations and source trace

These are four actual UI observations, not a random market sample. The after column is the corrected decision-gate trace from the visible business and Pace state, not a claim that a new build is deployed or that full live payloads were replayed locally.

| Stock | Observed preprod decision | Observed evidence | Corrected gate trace |
|---|---|---|---|
| NBIS | Avoid, new purchase | Provisional P1; TTM Jun 30; growth +461.3%, operating margin −49.3%, cash after capex margin −434.2%; displayed cash coverage about 16 months | Review business, not an automatic Buy or Avoid. It still must satisfy the funded-growth screen and an eligible entry. |
| IREN | Reduce holding / Avoid new purchase | Provisional P4; annual Jun 30; growth +41.1%, operating margin −148.1%, cash after capex margin −315.8%; the same page says Funded for now, about 32 months | Review business pending growth qualification. Negative operating margin and investment cash flow alone no longer imply a sell-side action. |
| NVDA | Watch, new purchase | Provisional P2 but completed October P1; growth +83.4%, operating margin 65.2%, cash after capex margin 41.9%; Funds itself | Watch remains correct under the stated P1 policy. The visible card now explains that P2 is provisional and the decision uses P1. |
| NOW | Hold holding / Wait before buying | Provisional P3, completed October P2; growth +21.8%, operating margin 9.7%, cash after capex margin 30.8%; Funds itself; about 42% below high | Qualified eligible P2 supports Buy small / Add small. The drawdown remains a caution, not an automatic veto. Provisional P3 does not increase sizing. |

Links: [NBIS](https://nivora-git-preprod-anudeeppaleru.vercel.app/research/NBIS), [IREN](https://nivora-git-preprod-anudeeppaleru.vercel.app/research/IREN), [NVDA](https://nivora-git-preprod-anudeeppaleru.vercel.app/research/NVDA), [NOW](https://nivora-git-preprod-anudeeppaleru.vercel.app/research/NOW).

A dataset refreshed in November does not make June/July/September financial periods November financial statements. This release preserves those dates and values. It does not certify the provider's accounting inputs against new company filings.

## Corrected policy

- Unusable/conflicting financials or price: Review.
- Actual operating-liquidity distress, business deterioration or insolvency: existing Avoid/Reduce/Sell protections remain unchanged.
- Unsupported or incompletely qualified business: Review with the unmet requirements, not an adverse conclusion from missing inputs.
- Qualified P0: Wait/Hold. Qualified P1: Watch/Hold, regardless of historical cohort performance or an attractive model value.
- Qualified eligible P2: Buy/Add small. P3: Buy/Add gradually. P4: Buy/Add within limits. Existing cash-budget and position-limit guidance remains.
- A deeper provisional reading never increases an established eligible contribution. The primary card now states the provisional and eligible zones together.
- The already documented independent valuation-entry path remains available only when no eligible Pace level exists and its business/valuation gates pass; it cannot override explicit P0 or P1.
- Historical cohorts are descriptive context only. Missing pass inputs remain unknown. Matching requires a complete year of unique settled sessions, no future dates and a recent final close relative to the current decision clock. Numeric historical tables are unchanged.

The funded-growth thresholds remain conservative and unchanged: current comparable reports, growth of at least 20%, margin improvement of at least 5 percentage points, net cash, diluted-share growth no more than 10%, at least 24 months operating runway if operating cash flow is negative, and at least 18 months investment runway if cash after capex is negative. This audit does not force growth stocks to pass them.

## What the historical study establishes and does not

The retained report describes 34,291 overlapping stock-month observations in a surviving-stock universe and a short 2022–2025 regime. It uses a fiscal-end-plus-90-days proxy, not proof of actual publication availability, and predecessor Pace history. The exact deployed combinations of support, valuation, trend, drawdown and sizing were not validated. Raw constituent business outcomes are not included in this input ZIP. Its calibration summary concerns price ranges, not performance of the complete decision algorithm. These limitations do not justify hard action overrides in either direction.

## Verification

- New regression tests were observed failing on the original behavior, then passing after the fixes.
- Full-engine offline fixture checks cover qualified deep-fall P2/P4 buying, a funded but unqualified growth case staying Review, actual six-month operating runway staying Avoid/Reduce, and forming P2/completed P1 staying Watch/Hold.
- Source-derived rendering tests verify the actual headline, Buy/Add distinction, and visible provisional explanation.
- A 384-instrument seeded synthetic replay changed Buy 55 → 126, Wait 131 → 22, Watch 152 → 190, Review 46 → 46. This is regression-shape coverage only, not an actual-stock buy rate, return backtest or evidence that the policy is profitable. No thresholds were tuned to those counts.
- Independent review found and resolved the cached-cohort clock issue; no remaining blocking findings in the reviewed changes.
- Final aggregate verification passed: lint, formatting, 1,422 tests (zero failures), typecheck, production build, controlled API suite and 56 production-isolation traces. Results are recorded in `verification/decision-bias-20261113/summary.json` and the adjacent logs.

### Explicit visual QA limitation

The live preprod inspection succeeded. Corrected local browser QA did not: Chromium could not create its process singleton socket (`Operation not permitted`), including the reviewed retry. The app server starts and the five full-engine preflight checks pass, but desktop/mobile pixels, click interactions and overflow for the fixed build remain unverified. `scripts/verify-decision-bias-browser.mjs` retains the isolated 1440/390/320-pixel checks for an environment where Chromium can launch. No deployed visual-fix claim is made.

## Preserved

No change to financial values, financial formulas, analyst targets, scenarios, classifier/Pace thresholds, portfolio calculations, user settings, authentication, billing or data-source spending. Existing source files are retained. Documentation and tests were updated with the corrected decision contract.

Run Node 24.x, `npm ci`, `npm run verify`, and `npm run test:api` after extraction. The package root contains package.json. Deployment remains a separate owner action.
