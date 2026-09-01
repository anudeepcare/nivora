# NIVORA V63 Evidence & Reality Engine — Design

## Goal
Ship a production-hardened NIVORA release that can distinguish market truth from model opinion, remain honest about uncertainty, deploy on Vercel Hobby, and prove the paper-trading execution path end to end.

## Architecture
1. Market Truth Layer: Alpaca execution quote primary, Twelve Data research/cross-check fallback, explicit freshness/session/provider-disagreement states.
2. Decision Reality Layer: market/model disagreement, valuation robustness, falling-knife stabilization guard, early-warning risk, score attribution, confidence-aware price zones.
3. Calibration Layer: preserve exact-engine and weight-compatible evidence and add regime/archetype/horizon segmentation contracts.
4. Paper Trading Layer: canonical snapshot -> intent -> quote integrity -> risk -> Alpaca Paper -> order/fill/P&L audit. Add a secret-protected diagnostic endpoint and explicit paper-order self-test capability that is opt-in and cannot touch live-money execution.
5. Operations: Vercel Hobby-compatible `vercel.json`, GitHub Actions scheduler for the paper runner, build/type regression gates.

## Safety / product invariants
- Paper trading only; no autonomous live-money order path.
- Stale/disputed quotes may never authorize new risk.
- SELL/TRIM may reduce existing paper risk but may never open shorts.
- No BUY signal is manufactured to make testing easier.
- Reliability remains Collecting until matured evidence exists.
- Data coverage is not predictive accuracy.
- Historical calibration may be reused only when model contracts are compatible and must be labeled by scope.
