# Monthly accumulation v3

This is an original, documented experimental price-conditions policy, not a copy of another company's private signal. Its purpose is to distinguish ordinary conditions, deeper pullbacks and price extension. It does not predict returns, value a company, prove support or determine personal suitability.

## Inputs and clock

Valid settled daily OHLC observations, on one coherent adjustment basis. US equities include today's bar only after 17:00 America/New_York; crypto includes completed UTC days. Future/invalid observations, weekends for US equities and conflicting duplicate OHLC dates are excluded. A completed month requires its final expected market session. The prior 24 monthly observations must be consecutive and complete. Missing evidence is null, not 0×.

## Fixed rules

For each target month, fit the preceding 24 log monthly closes using median pairwise slope and median intercept. The target observation is excluded from fitting. The spread is the maximum of 0.07 log units, robust residual MAD and robust monthly-return MAD × √3 (MAD multiplier 1.4826). Extrapolate one monthly step to the target.

Let z = log(target close / fitted trend) / spread. Drawdown uses the prior 24-month closing high.

| Zone | Conditions |
|---|---|
| 0× pause | z ≥ 2 and price ≥ 1.25 × trend |
| 4× | drawdown ≤ −40% and z ≤ −2 |
| 3× | drawdown ≤ −25% and z ≤ −1.35 |
| 2× | drawdown ≤ −12% and z ≤ −0.7 |
| 1× | otherwise |

Bands use the same prior-window intersection of trend and drawdown thresholds. A falling short trend adds a risk explanation; it does not secretly change a multiplier. A separate extension-review flag requires z ≥ 3 and at least 50% twelve-month price growth. Neither pause nor extension automatically sells anything.

Confirmed and forming signals are returned separately. A later quote is not an input, so a missing or delayed live quote does not erase a settled monthly signal. History revisions can change historical results; persistent immutable signal journaling is not implemented by this policy.

## Evaluation and limitations

`evaluateAccumulation` deposits 100 model units per month to each of normal DCA and adaptive accounts. The prior confirmed signal is executed at the next month first observed open; fees/slippage are deducted and available cash bounds spending. No borrowing or automatic selling. Completed month-end values include carried cash. Monthly drawdown adjusts for deposits. A later 30% slice restarts both accounts at zero and is reported separately.

No independent market-wide validation or outperformance is established. The fourteen-instrument audit checks calculation behavior, not profitability. The sample is selected and excludes delisted stocks. Dividends, interest, taxes, corporate-action revision history and user-specific risk are not modeled. A true multi-regime point-in-time validation would require licensed adjusted and delisted histories.

## Reproducibility

Legacy v1 and candidate v2 remain in `lib/engine.ts`, `lib/accumulation-policy.ts` and `lib/policy-evaluation.ts`. They are not alternative headline signals. Production Overview, Technicals and the standalone accumulation component use v3.

`verification/dca-multi-instrument-audit.json` records actual connected-history calculations through 22 October 2026. Example: APP v3 is 3× confirmed and forming, while DCA Optimizer showed 4×/4×. IREN v3 is 1× confirmed and 2× forming, while DCA Optimizer showed 2×/4×. The thresholds were not fitted to remove these differences.
