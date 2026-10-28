# AURYN valuation v1 model card

## Intended use

Point-in-time research and scenario analysis. The model separates business evidence, valuation assumptions and confirmed AURYN Pace. It is not an order router and does not promise a return or a forecast accuracy percentage.

## Methods

Routing selects the applicable method from observed instrument and business evidence: multi-stage cash flow, residual return, REIT AFFO/NAV, funded growth, cyclical mid-cycle, distress recovery, or facts-only refusal. Bear/base/bull cases are deterministic percentile sensitivities. Monte Carlo, options implied volatility and alternative data remain shadow-only until their data quality and performance are measured.

## Data and point-in-time rule

Only observations filed and effective on or before `asOf` are eligible. Corporate actions are applied before reconciliation. Conflicts, missing shares, mismatched currencies and insufficient histories lower quality or refuse valuation; they never become zeroes.

## Outputs and controls

Every result carries a model version, config hash and trace ID. Output records are append-only. Overrides are proposed and separately approved with a reason. A visible status may be `ok`, `low-confidence`, `range-only` or `refused`; it never silently downgrades into a generic Buy/Hold/Sell.

## Validation gates

Backtests require a historical point-in-time input and a later realised return. Future observations are excluded. Coverage, calibration, rank power, decile spread, bias, refusal honesty and family stability are reported independently. Insufficient holdout data is reported as unavailable, not passed.

## Known limitations

Vendor completeness, accounting classification and future business outcomes limit forecast accuracy. A 99.9999% integrity target applies to deterministic calculation, lineage and reproducibility checks—not to predicting markets. Human review is required for material overrides and unusual capital structures.

