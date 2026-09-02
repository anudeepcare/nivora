# NIVORA V64.2 — Real-Market BUY Calibration

V64.2 addresses a concrete V64.1 failure mode: the canonical `BUY` branch was reachable in synthetic policy tests, but real analyzed stocks were overwhelmingly resolving to WAIT / NO ACTION / AVOID.

V64.2 does **not** lower one global threshold to manufacture BUYs. It introduces archetype-specific new-money pathways and records exactly why each stock does or does not qualify.

## BUY pathways

### QUALITY_COMPOUNDER
For durable compounders/infrastructure:
- Thesis >= 72
- Company quality >= 72
- Opportunity >= 64
- Forward evidence >= 60
- Financial quality >= 58
- Risk pressure <= 58
- Timing >= 50
- If stabilization is WATCH, timing >= 55
- No hard veto / broken thesis / falling-knife / extreme disagreement guard

This path deliberately allows a strong company to earn a **starter BUY** with acceptable-but-not-perfect short-term timing. It avoids the prior logical trap where a cheaper high-quality stock could remain WAIT forever because momentum was not already perfect.

### CYCLICAL_VALUE
For cyclicals/miners:
- Thesis >= 68
- Company quality >= 64
- Opportunity >= 62
- Financial quality >= 65
- Forward evidence >= 58
- Risk <= 58
- Timing >= 55
- If valuation exists, it cannot be Expensive

### GROWTH_MOMENTUM
For hypergrowth/AI infrastructure:
- Thesis >= 75
- Company quality >= 68
- Opportunity >= 65
- Growth >= 72
- Forward >= 68
- Financial quality >= 48
- Risk <= 58
- Timing >= 58
- Absolute valuation may be unavailable when the archetype legitimately lacks a decision-grade model

### FINANCIAL_VALUE
For banks/insurers:
- Thesis >= 68
- Company quality >= 65
- Opportunity >= 62
- Financial quality >= 68
- Forward >= 55
- Risk <= 55
- Timing >= 52
- Available valuation cannot be Expensive

### CATALYST_GROWTH
For pre-scale / biotech:
- Thesis >= 78
- Company quality >= 62
- Opportunity >= 66
- Growth >= 75
- Forward/catalyst evidence >= 72
- Risk <= 52
- Timing >= 60

### BALANCED_STANDARD
Fallback for general companies:
- Thesis >= 72
- Company quality >= 65
- Opportunity >= 65
- Forward >= 58
- Risk <= 58
- Timing >= 55

## Absolute new-risk guards

No pathway can override:
- hard veto
- broken/bearish thesis
- inconsistent evidence
- WEAK timing
- OVEREXTENDED timing
- required falling-knife stabilization
- HIGH early-warning risk
- HIGH market/model disagreement together with FRAGILE valuation

## What changes in the UI

Every stock now exposes:
- `BUY PATH` when a pathway is satisfied
- `CLOSEST BUY PATH` when it is not
- the exact primary blocker
- up to four passed/failed criteria

So WAIT should no longer be generic.

## Real-market decision audit

Trading Lab now shows, for the latest V64.2 snapshot of each analyzed ticker:
- number of unique tickers analyzed
- BUY count and percentage
- dominant blocker
- closest-to-BUY ticker
- five closest candidates

A protected raw endpoint is also available at:

`GET /api/decision-audit`

using `Authorization: Bearer $TRADING_LAB_CRON_SECRET`.

## Offline distribution audit

Export real pre-Today decision inputs and run:

```bash
npm run audit:decisions -- --input decision-inputs.json --output decision-audit.json
```

The audit reports action distribution, path distribution, dominant blockers and nearest-to-BUY names. It never targets a desired BUY percentage.

## Backtest validation

Historical replay now records:
- Today action
- BUY path
- BUY tier
- primary BUY blocker

Backtest reports measure the BUY cohort separately:
- BUY sample size
- BUY hit rate vs benchmark
- average alpha after costs
- bootstrap 95% alpha interval
- performance by BUY pathway

A BUY cohort remains `UNPROVEN` unless at least 30 historical BUY observations exist and the bootstrap alpha interval is entirely above zero. Even then the label is `BACKTEST_EDGE`, not `VALIDATED`; untouched OOS and forward-paper evidence remain required.

## Important

V64.2 pathways are still **versioned heuristic policy** until point-in-time backtesting, untouched out-of-sample validation, and forward paper outcomes support them. This release fixes real-input decision reachability and observability; it does not claim predictive proof.
