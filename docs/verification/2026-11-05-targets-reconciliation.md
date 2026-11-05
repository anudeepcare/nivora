# Targets and estimates reconciliation — 5 November 2026

## Access and scope

The DCAOptimizer public home was accessible in the browser during this work. Its actual Charts link redirected to `https://dcaoptimizer.com/auth?next=%2Fapp%2Fcharts`, which initially displayed “Page not found” and subsequently resolved to a sign-in page, with no authenticated chart data. No authenticated current chart, company estimate, target, or model assumptions could be inspected. Therefore none of the eight tickers below has a fresh like-for-like DCA reconciliation. No access bypass or guessed credentials were used.

This document separates user-observed values, a previously saved research fixture, and synthetic regression checks. It does not certify current market values or equality with another product.

## Evidence matrix

| Symbol | Available AURYN evidence in this correction | DCA target, horizon, input date, currency and assumptions | Reconciliation |
| --- | --- | --- | --- |
| APP | User-reported display: analyst consensus $448.43, conditional EPS case $235.25, historical median $355.15. These are three distinct methods. Source values and dates have not been freshly retrieved. | Unavailable behind the Charts/auth sign-in | Unverified; do not equate the outputs |
| NOW | No fresh ticker inputs inspected | Unavailable | Unverified |
| MSFT | Synthetic preview/test data only; not current ticker evidence | Unavailable | Unverified |
| META | No fresh ticker inputs inspected | Unavailable | Unverified |
| SOFI | No fresh ticker inputs inspected | Unavailable | Unverified |
| IREN | Saved fixture retrieved 2026-10-19, dataset dated 2026-10-18: analyst target 77.8056 USD. Revenue model correctly withheld because dated market-cap/share observations and listed-share units are absent. Historical sample insufficient. This is not a current quote comparison. | Unavailable | Unverified; historical fixture only |
| ASTS | No fresh ticker inputs inspected | Unavailable | Unverified |
| NBIS | Synthetic infrastructure regression coverage only; not current ticker evidence | Unavailable | Unverified |

The rounded APP operands reported in the task, 19.57 EPS × 12 P/E, equal 234.84, not 235.25. Without raw input precision and observation dates, the 0.41 difference cannot be attributed reliably. The application must expose the underlying fiscal period and multiple and must not tune the outcome to match a screenshot.

## Implemented safeguards and interpretation

- Published analyst consensus remains a separate opinion with its dataset date. Target horizon, target contributor count and split basis remain unavailable when the source does not provide them.
- Annual estimates normalize provider relative labels such as `0y` to the year of the dated fiscal end, preserving the original provider label in the model. Existing freshness, currency, published-period and ordered-range guards remain.
- Automatic earnings sensitivity no longer accepts any positive `ForwardPE` blindly. Its implied EPS (reference price / P/E) must fall within the nearest annual positive EPS range, with an explicitly disclosed 10% tolerance. The reference annual period must end between the observation date and 550 days later. It never validates the P/E against the selected approximately three-year exit EPS. A numeric match is not verification of the denominator's accounting or split basis.
- Incompatible or uncheckable forward P/E withholds automatic EPS outcomes. A user can explicitly set a positive exit P/E up to 500×, clearly labelled as their assumption. This does not bypass forecast range, currency, date, business suitability or listing safeguards, and does not alter analyst consensus or historical outcomes.
- Historical cards use 10th percentile, historical median and 90th percentile. They are empirical return outcomes at a session horizon, not analyst targets or company valuation cases.
- Revenue cases retain market-cap/share/price, dated balance, currency, enterprise-value and trailing-revenue reconciliation requirements.

## Validation

99 focused tests passed across outlook, targets/estimates, revenue outlook, financial normalization, scenario shape matrix and historical price risk. These include synthetic input-shape/business-type coverage and the previously saved IREN fixture; they are not fresh eight-ticker external validations. TypeScript check passed during implementation. Browser appearance, touch behavior and physical iPhone acceptance require separate checks.
