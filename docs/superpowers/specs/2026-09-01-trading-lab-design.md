# NIVORA Trading Lab Design

## Goal
Add a production-grade paper-trading laboratory to NIVORA that converts frozen V60 decisions into deterministic paper trade intents, applies hard portfolio/execution risk gates, optionally routes approved paper orders to Alpaca Paper, and grades realized trades without permitting autonomous live-money execution.

## Architecture
The canonical investment engine remains unchanged. Trading Lab consumes already-produced NIVORA decisions/snapshots and creates a separate `TradeIntent`. A deterministic risk engine can approve, resize, or reject the paper intent. A broker adapter boundary supports `paper` and `live` modes; paper may auto-submit, while live mode always returns `APPROVAL_REQUIRED` and never auto-submits. All orders, fills, policy versions, evidence fingerprints, and performance metrics are auditable.

## Components
- `nivora-trade-intent.ts`: deterministic mapping from Today actions to trade intents.
- `nivora-trading-risk.ts`: capital, concentration, loss, spread, gap, stale quote, and duplicate-order gates.
- `nivora-paper-execution.ts`: deterministic limit-order planning and slippage/fee simulation.
- `nivora-trading-metrics.ts`: P&L, win rate, profit factor, drawdown, expectancy, benchmark-relative return.
- `nivora-broker.ts`: broker-neutral contracts and live-approval safety boundary.
- `alpaca-paper.ts`: Alpaca Paper-only adapter; base URL is hard-locked to paper trading.
- `/api/trading-lab/*`: status, evaluate, and paper-run endpoints.
- `/trading-lab`: user-facing Trading Lab dashboard.
- Supabase migration: configs, intents, orders, and fills.

## Invariants
1. Trading Lab cannot change Company Score, Thesis Score, Opportunity Score, valuation, or Today policy.
2. `WAIT`, `HOLD`, and `NO ACTION` never create entry orders.
3. A blocked Today decision never creates new risk.
4. Stale quotes, excessive spreads/gaps, breached daily-loss limits, duplicate intents, and position-limit violations block paper orders.
5. Live mode cannot auto-submit orders under any configuration.
6. Paper orders use deterministic client IDs for idempotency.
7. No broker credentials are stored in the repository or database migration.
8. Performance claims remain empirical and sample-size aware.
