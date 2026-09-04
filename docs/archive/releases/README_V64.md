# NIVORA V64 — Quant Validation & Proven-Edge Engine

V64 is a proof-and-audit release. It does not declare NIVORA accurate; it builds the machinery required to earn that claim.

## Major changes
- Canonical live + backtest technical engine.
- Wilder RSI and ATR.
- Claude point-in-time SEC backtest harness integrated and hardened.
- Walk-forward out-of-sample split.
- Transaction-cost-adjusted alpha.
- Bootstrap alpha confidence intervals and optional permutation baseline testing.
- Historical-universe / survivorship-bias quality checks.
- Formal evidence ladder: UNVALIDATED → BACKTESTED → OUT_OF_SAMPLE_VERIFIED → FORWARD_VALIDATING → VALIDATED.
- Metric provenance contract for core displayed numbers.
- No `Unavailable · 0/100` UI.
- Mobile-first decision hierarchy.
- Market-closed quote age removed from the primary decision UI.
- Data coverage moved out of the main score strip; it is explicitly not predictive accuracy.
- Professional number formatting and confidence-aware price precision.
- Risk-per-trade position sizing added to the Alpaca Paper runner for BUY/ADD intents.
- V63 Alpaca/Twelve quote integrity, GitHub scheduler and paper-only safety are preserved.
- Vercel Hobby configuration remains `{}`.

## Backtest
Copy `validation/universe.example.json` and replace it with a genuine historical universe.

```bash
npm run backtest -- --universe validation/universe.json --start 2018-01-01 --end 2025-01-01 --horizonDays 63
```

Do not call results decision-grade when the universe manifest is `LIMITED`.

## Why the score UI changed
A score such as `79/100` is a versioned model output, not `79% probability of profit`. Number provenance shows formula version, evidence sources, and validation status. Unavailable values are withheld rather than displayed as zero.

## Paper trading
Automatic execution remains Alpaca Paper only. BUY/ADD intents now require a decision-linked invalidation and are sized from paper-account equity using `TRADING_LAB_RISK_PER_TRADE_PCT` before the existing portfolio risk gates run.

Default:
```env
TRADING_LAB_RISK_PER_TRADE_PCT=0.5
```

## Known validation limits
- Historical analyst estimates are not reconstructed without a legitimate point-in-time vendor.
- The replay harness is signal validation, not a complete institutional portfolio simulator.
- Live predictive reliability remains unproven until historical, untouched OOS and forward evidence pass the preregistered policy.
