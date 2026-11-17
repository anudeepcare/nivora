# AURYN frozen DCA validation — 23 October 2026

**Finding: no convincing outperformance in this first unseen-security sample.**

Rules were frozen before retrieving eight additional tickers. No thresholds were changed after examining outcomes. Each strategy received 100 model dollars per month for 68 months, February 2021–September 2026: total 6,800. Daily history begins January 2020 for warm-up. October execution is excluded because the month is incomplete.

| Security | Ordinary DCA ending value | AURYN ending value | Difference | Ordinary monthly drawdown | AURYN monthly drawdown |
|---|---:|---:|---:|---:|---:|
| SPY | $10,529.36 | $10,529.36 | +0.00% | -24.84% | -24.84% |
| QQQ | $12,385.27 | $12,385.27 | +0.00% | -33.12% | -33.12% |
| KO | $9,242.96 | $9,242.96 | +0.00% | -14.10% | -14.10% |
| JPM | $12,590.83 | $12,668.44 | +0.62% | -38.54% | -35.59% |
| XOM | $11,607.60 | $11,600.95 | -0.06% | -19.42% | -19.01% |
| JNJ | $10,537.00 | $10,515.03 | -0.21% | -19.95% | -19.95% |
| DIS | $6,432.58 | $6,432.58 | +0.00% | -57.27% | -57.27% |
| PYPL | $4,606.21 | $4,606.21 | +0.00% | -85.24% | -85.24% |

One win, two losses and five ties; mean relative ending-value difference +0.044%. Monthly drawdown improved in two of eight cases. At 50 bps purchase costs the same win/loss/tie pattern remained. These are descriptive results, not statistical evidence of skill.

## What the test reveals

AURYN can spend only available cash. Because a 1× reading invests the entire regular monthly contribution, many later 3×/4× readings cannot increase purchases unless an earlier 0× reading left cash behind. Five ties mean identical effective investment schedules in this test, not proof of successful timing. No leverage or extra capital was supplied.

A 4× signal measures a price condition; it is not a return forecast or instruction to borrow. The formula alone is not a complete allocation policy.

## Limitations

- Selected surviving securities; not representative of the full investable universe.
- Price-only; dividends, cash interest and taxes omitted. Corporate-action adjustment provenance has not been independently reconciled.
- 10 bps each purchase; 50 bps stress. 100 units deposited monthly in each strategy; stronger multipliers use only carried cash, no leverage.
- Prior confirmed monthly signal executes at next observed month opening price. Monthly marked drawdowns miss intramonth losses.
- No new competitor reference labels: this does not measure DCA Optimizer parity.
- Rules unchanged; no threshold tuning after results.

The new sample has no supplied competitor historical signal labels, so this test cannot establish numerical parity. It also cannot establish company quality or justify automated trading.

## Next validation steps

1. Independently reconcile split adjustments and include dividends and realistic cash yields.
2. Pre-register a broader universe including delisted/distressed names and evaluate rolling start dates.
3. Compare a separately specified reserve-funded allocation policy against ordinary DCA with identical initial cash and ongoing contributions. Keep that a new experiment; do not retrofit this result.
4. Collect unseen competitor month-end labels separately if exact signal parity remains a requirement.
5. Run a prospective paper evaluation with rules frozen.

## Reproducibility

Run `node --experimental-strip-types scripts/validate-dca-frozen.mjs /path/to/private-daily-bars.json` from the source root. Input maps ticker symbols to chronological daily OHLC candle arrays. Raw licensed data is excluded. Audit JSON records policy and evaluator SHA256 hashes. Seven existing policy/evaluation tests passed, with additional per-security invariants for equal funding, execution after the signal, nonnegative cash, future-data invariance and unchanged source hashes. Production UI and algorithms were not modified in this evaluation.
