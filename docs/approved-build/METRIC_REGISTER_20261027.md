# Metric register — 27 October 2026

This register documents displayed calculations and their limits. It is not evidence that a metric, threshold or decision policy predicts returns. The overview uses actual selected `FinancialPeriod` values; missing inputs are omitted rather than replaced with zero or estimates.

## Financial observation basis

Annual and TTM observations retain currency, accounting basis, period start/end, filing reference and source URLs. Prior comparisons require matching currency/accounting basis and a comparable year-earlier end. TTM flows require four complete, contiguous quarters in the same series; closing balances use the final quarter and weighted average shares use quarter-day weights. Latest reporting-period selection is deterministic. Each displayed business metric exposes its period/basis/source fields and formula in its help text. Comparative metrics include prior-period sources. No currency conversion is assumed.

| Overview metric | Exact calculation | Availability and interpretation |
| --- | --- | --- |
| Revenue; net income; operating cash flow | Selected reported period amounts | These are observations, not forecasts. Net income may contain unusual gains/charges; operating cash flow includes working-capital effects. |
| Revenue growth | `(current revenue / prior revenue − 1) × 100` | Prior revenue must be positive. Compares annual with annual or TTM with TTM; not forward growth. |
| Gross margin | `gross profit / revenue × 100` | Positive revenue required. Gross profit may be derived only from matching revenue and cost observations. |
| Operating margin | `operating income / revenue × 100` | Positive revenue required. Negative margins, including below −100%, retain their actual magnitude. |
| Capital spending | `abs(reported capex)` | Spending is shown as a positive amount. No maintenance/growth split is invented. |
| Free cash flow | `operating cash flow − abs(capex)` | Cash flow and capex must match period/currency/basis/accession/filing. Growth investment can cause negative FCF without operating cash burn. |
| FCF margin | `FCF / revenue × 100` | Positive revenue required. |
| FCF per diluted weighted share | `FCF / diluted weighted-average shares` | Positive reported diluted weighted-average shares required; this is not current shares outstanding. TTM uses the day-weighted mean of four reported quarter averages. No current price, ADR ratio or future dilution is inferred. |
| Cash conversion | `operating cash flow / positive net income × 100` | Aligned with `FinancialPeriod.cashConversion`; capex is excluded. Missing, zero or negative net income does not produce a conversion percentage. |
| Cash; total debt | Selected reported closing balances | Cash may be restricted; reported debt does not necessarily include every lease or other claim. |
| Net debt | `reported debt − reported cash` | Both required. Negative net debt means net cash and is not styled as a loss. |
| Interest coverage | `operating income / positive interest expense` | Zero/missing interest does not imply unlimited coverage. Below 1 means this period's operating income does not cover the reported expense; it is not a calibrated default model. |
| Current ratio | `current assets / positive current liabilities` | Below 1 means recorded current liabilities exceed recorded current assets. This is not a standalone solvency test. |
| Stock compensation / revenue | `stock compensation / positive revenue × 100` | An expense measure, not net dilution after repurchases. |
| Diluted weighted share growth | `(current diluted weighted shares / prior diluted weighted shares − 1) × 100` | Positive prior shares required. Reflects weighted share observations; splits/restatements and dilutive securities need review before calling the change issuance or buybacks. |
| Operating cash runway, months | `cash / abs(negative operating cash flow) × inclusive period days / (365.25 / 12)` | Requires nonnegative reported cash and actual operating cash burn. Historical rate only; excludes capex, debt maturities, restricted-cash adjustments and future financing. No runway is invented from negative FCF caused solely by capex. |
| Return on average equity (ROE) | `net income / ((beginning equity + ending equity) / 2) × 100` | Both book-equity balances must be positive and comparable. Period return, not ROIC, tangible-equity return or a cost-of-capital comparison. |
| Return on average assets (ROA) | `net income / ((beginning assets + ending assets) / 2) × 100` | Both asset balances must be positive and comparable. Book accounting, asset mix and one-off charges affect comparability. |

ROE/ROA use the selected annual or TTM earnings period and year-earlier closing balance. They are not rescaled to an invented standard year. Help text shows actual period dates. Published net income/equity definitions must be checked before treating the ratios as issuer-reported ROE/ROA.

## Sector applicability

- Operating businesses, infrastructure and frontier companies can show actual OCF, capex, FCF, per-share cash, coverage and historical burn where supplied. These descriptive measures do not replace committed funding, construction progress, unit economics or a complete financing model.
- Banks, insurers, other specialized financial companies and REIT/property businesses omit the overview's generic FCF/cash-conversion, net-debt, interest/current-coverage and operating-runway interpretations. They retain reported revenue, earnings, available book ROE/ROA, share observations and individually labelled balance amounts.
- Bank book returns are not regulatory capital, tangible equity, credit-loss adequacy or liquidity measures. Insurance book returns do not establish reserve adequacy or underwriting quality. REIT book returns reflect depreciation and property accounting and are not FFO, AFFO, property yields or net asset value.
- The system does not invent ROIC, maintenance capex, bank capital/CET1, net interest margin, loan losses, insurance reserves, FFO/AFFO or customer-retention metrics. Crypto receives no corporate financial metrics. Fallback business classification remains provisional.

## Market, scenario and technical observations

| Metric | Calculation/basis | Limit |
| --- | --- | --- |
| Forward/trailing P/E, EV/revenue, price/book | Positive provider-reported fields; not reconstructed as independent value | Accounting and observation dates can differ. Sector suitability requires review; a low multiple does not establish value. |
| Institutional/insider ownership | Provider-reported percentages, including observed zero | Different report dates and overlapping holdings; not net buying/selling or proof of investor conviction. |
| Capitalization consistency | `(cap / (matching listed shares × matching price) − 1) × 100` | Only explicit same-time/currency/listing observations are compared. Unknown dates are missing evidence, not a financial conflict. Existing 10% tolerance is a consistency heuristic. |
| Earnings sensitivity | Positive forecast EPS low/base/high × forward P/E × `0.8 / 1.0 / 1.2` | Disclosed sensitivity assumptions, not intrinsic value or a funded operating forecast. |
| Revenue sensitivity | `max(0, revenue × exit EV/revenue − net debt) / (shares × (1 + dilution))` | Explicit listing bridge and valid dated balance data required. Existing `20% / 10% / 0%` cumulative dilution assumptions are uncalibrated. |
| Scenario total/annual return | `(target / reference − 1) × 100`; `((target / reference)^(1 / years) − 1) × 100` | `years` is the actual forecast date distance from the assessment clock divided by 365.25 days. Forecasts and quotes expire independently. |
| RSI 14 | Wilder-smoothed 14-change average gains/losses; `100 − 100 / (1 + gains/losses)` | Completed observations; flat series is 50 and loss-free rising series is 100. Descriptive momentum, not a trade instruction. |
| 50/200-session mean | Arithmetic average of the last 50/200 completed closes | Requires the observation count; not an execution price or independently verified continuous trading record. |
| Typical daily range | Mean of 14 true ranges / latest completed close × 100; true range is max(high−low, abs(high−previous close), abs(low−previous close)) | Simple mean true range, not Wilder-smoothed ATR and not a future-loss limit. |
| Relative volume | Latest completed volume / mean of the preceding 20 completed volumes | Requires positive valid volume; not evidence of institutional buying. |
| 20-session price change | `(latest completed close / close 20 observations earlier − 1) × 100` | Distinct from revenue/earnings growth and from a total return including dividends. |

Pace's frozen monthly-v5 policy, confirmed/forming distinction and empirical limitations are recorded in [PACE_VALIDATION_20261027.md](PACE_VALIDATION_20261027.md). Cash-flow sensitivity, reverse-growth solving, quarter derivation and unit/provenance guards are documented in [FINANCIAL_VALIDATION_20261027.md](FINANCIAL_VALIDATION_20261027.md). Provider coverage limitations are in [COVERAGE_VALIDATION_20261027.md](COVERAGE_VALIDATION_20261027.md).

## Color meaning and verification

Negative operating profitability/cash generation/returns are risk; observed positive figures can use positive tone without claiming an attractive investment. Zero stays neutral in individual metrics. Capital spending and stock compensation ratios are descriptive rather than automatically bearish. Increased weighted shares and finite operating cash runway use caution. Net cash uses positive tone even though the signed net-debt value is negative. Coverage below 1 uses caution; negative operating-income coverage uses risk. No return-tested threshold was added.

Business-history counts use neutral when observations are absent, risk when zero observed years are profitable/cash-generating, caution for mixed histories and positive when all observed years qualify. Zero net income or zero FCF is an observed non-positive year, not a missing observation.

Five overview regressions were observed failing before implementation: hand-calculated operating metrics/provenance, actual-duration operating runway, positive comparable beginning/end balance requirements, bank applicability, and negative coverage tone. A component-render regression covers missing/zero/loss/mixed/all-positive history colors. Focused verification results are reported with the integrated release checks; no live statement or investment-performance validation is claimed here.
