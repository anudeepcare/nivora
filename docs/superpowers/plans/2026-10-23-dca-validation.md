# Frozen DCA validation plan

Goal: evaluate monthly-v5 without modifying its thresholds.

Use the existing equal-budget evaluation: 100 units contributed monthly, next-month open execution from prior confirmed signals, carried cash only, 10 bps costs and 50 bps stress. Report ending assets, cash drag and monthly deposit-adjusted drawdown. Inspect untouched tickers separately from calibration tickers. No competing-product historical labels are available for the new sample; no parity accuracy percentage may be inferred.

1. Record SHA256 of policy and simulator before evaluation.
2. Evaluate SPY, QQQ, KO, JPM, XOM, JNJ, DIS and PYPL using daily history Jan 2020–Oct 22 2026. Exclude the incomplete October execution month.
3. Repeat with 50 bps costs; check equal contributions, nonnegative cash and execution after signals.
4. Publish every result including underperformance, provenance and limitations. Preserve original rules regardless of outcome.

Limitations: selected currently listed survivors; historical prices were retrieved after policy freeze and are not a prospective trial. Price-only; dividends, cash interest and taxes omitted. Drawdown is monthly, not maximum daily drawdown. Prior-history calibration may indirectly overlap market regimes. A 3×/4× signal cannot spend more than available carried cash under equal-budget comparison.
