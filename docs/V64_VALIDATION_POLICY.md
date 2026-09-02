# NIVORA V64 Validation Policy

This document is intentionally written before production validation results are accepted.

## Evidence ladder

`UNVALIDATED` — insufficient evidence or a failed prerequisite.

`BACKTESTED` — at least 1,000 historical comparable signal observations, positive benchmark-relative average alpha, Brier <= 0.25, ECE <= 10%, stated drawdown control, evidence across at least three market regimes and three archetypes, and decision-grade historical data quality.

`OUT_OF_SAMPLE_VERIFIED` — BACKTESTED requirements plus at least 500 untouched out-of-sample observations. Test data may not be reused for tuning and then still called out-of-sample.

`FORWARD_VALIDATING` — OOS requirements passed and live/paper comparable outcomes are accumulating.

`VALIDATED` — OOS requirements plus at least 100 forward-live comparable observations and all preregistered gates still pass.

## Non-negotiable data rules
- Historical SEC inputs are filtered by `filed` date, not fiscal period end date.
- Current analyst ratings/targets are never copied backward into historical dates.
- A historical universe must prove point-in-time membership, include removed/delisted securities, and handle delisting returns before survivorship-bias control is called decision-grade.
- Transaction costs are applied before reporting hit rate/alpha.
- V64 Wilder indicator history is not silently pooled with older indicator-formula versions.
- A high score is not a probability unless calibration empirically establishes that interpretation.

## Statistical evidence
Backtest reports include bootstrap confidence intervals for mean alpha. A random/equal-opportunity baseline may be supplied for a permutation test; NIVORA must show that extra model complexity adds measurable value rather than merely benefiting from the chosen universe.

## Important limitation
The current V64 replay validates signal behavior, not a fully realistic multi-position portfolio equity curve. Full portfolio capacity, overlapping positions, turnover, tax, financing, borrow and strategy drawdown simulation remain separate evidence before a live-money automation claim can be considered.
