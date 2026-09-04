# NIVORA V65

NIVORA V65 is a mobile-first investment decision and validation platform. It separates slow business/thesis evidence from fast market/timing evidence, supports stocks/crypto/cash portfolios, makes paper execution auditable, and measures whether the engine actually earns predictive reliability.

## V65 decision contract

Every analyzed investment separates:

- **Long-term view** — driven mainly by company quality, durability and forward evidence.
- **New money today** — combines thesis with timing, valuation/risk and confirmation.
- **If you own it** — ADD / HOLD / TRIM / EXIT management guidance.

Daily quote movement can change Timing, Opportunity and Entry. It cannot by itself rewrite Company Quality or the slow fundamental thesis.

## Portfolio

V65 supports:

- `EQUITY`
- `CRYPTO`
- `CASH`

Cash counts toward total value, liquidity and allocation but never receives an equity thesis score. Crypto is kept separate from equity-only fundamental/sector calculations.

### Required one-time migrations

Run these two files in the Supabase SQL editor before deploying V65:

```text
supabase/20260904_v65_portfolio_assets.sql
supabase/20260904_v65_trading_runs.sql
```

The portfolio migration preserves existing stock rows as `EQUITY` and adds `asset_type`/`currency`. The trading-runs migration adds run-by-run scheduler/execution proof without replacing the existing V61 trade tables.

## Trading Lab

Trading Lab is **Alpaca Paper only**.

The UI separates:

- broker connectivity,
- evaluated decisions,
- paper orders,
- fills,
- matured outcomes,
- learning/calibration state.

`CONNECTED` does not mean a trade occurred. `LEARNING` is shown only when exact-engine outcomes have matured.

Paper orders do not request user approval because no live money is used. Live-money automatic execution remains disabled.

## Automatic validation loop

GitHub Actions includes:

- `.github/workflows/nivora-paper-trading.yml`
- `.github/workflows/nivora-portfolio-learning.yml`
- `.github/workflows/nivora-calibration-mature.yml`
- `.github/workflows/nivora-paper-self-test.yml`
- `.github/workflows/nivora-market-scanner.yml`

The portfolio-learning job freezes current portfolio-equity decisions. The maturity job later measures 30D / 90D / 180D / 1Y / 2Y benchmark-relative outcomes and refreshes reliability buckets.

Production weights are frozen for the V65 engine. Outcomes may evaluate a challenger, but promotion is never automatic and must create a new engine version.

## Environment

Continue using the V64.2 production variables, including:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWELVE_DATA_API_KEY=
ALPACA_PAPER_API_KEY=
ALPACA_PAPER_API_SECRET=
TRADING_LAB_CRON_SECRET=
TRADING_LAB_PAPER_ENABLED=true
TRADING_LAB_RISK_PER_TRADE_PCT=0.5
```

Optional diagnostics:

```env
TRADING_LAB_SELF_TEST_ORDER_ENABLED=false
TRADING_LAB_SELF_TEST_SYMBOL=SPY
```

## Verification

```bash
npm ci
npm test
npm run audit:v65
npm run build
```

Deploy only after all commands succeed.

## Evidence standard

Coverage is not accuracy. A score such as `79/100` is a versioned model output, not `79% probability of profit`. Missing evidence is not zero. Model reliability must be earned from benchmark-relative, version-matched historical/OOS/forward outcomes.

See:

- `docs/superpowers/specs/2026-09-04-nivora-v65-design.md`
- `docs/superpowers/plans/2026-09-04-nivora-v65-implementation.md`
- `/methodology`
- `/terms`
- `/disclaimer`
