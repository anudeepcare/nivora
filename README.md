# AURYN V4 Production

AURYN is a mobile-first investment decision and validation platform. The V4 production surface adds a decision-first analyst core on top of the proven V65 evidence, portfolio, calibration and paper-trading foundation. It separates slow business/thesis evidence from fast market/timing evidence and returns one canonical investment decision with horizon-specific context.

## V4 production decision layer

The stock page now runs the canonical V4 analyst core and presents the same underlying decision at three depths:

- **Beginner** — action first, plain-English reasons and horizon calls.
- **Pro** — the same call plus key factor evidence.
- **Extreme Pro** — the same call plus analyst-model, model-fit, thesis, moat and evidence-state diagnostics.

The presentation mode never changes the decision engine. V4 primary actions are `STRONG_BUY`, `BUY`, `HOLD`, `REDUCE`, `SELL`, or `INSUFFICIENT_EVIDENCE`; `WAIT_FOR_CONFIRMATION` is not a V4 investment verdict. Decision confidence describes evidence/model quality and is not a probability of profit.


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
- `.github/workflows/nivora-market-scanner.yml`

The portfolio-learning job freezes current portfolio-equity decisions. The maturity job later measures 30D / 90D / 180D / 1Y / 2Y benchmark-relative outcomes and refreshes reliability buckets.

For scheduled GitHub jobs, add repository secrets `AURYN_PRODUCTION_URL` (the deployed app origin, for example the Vercel production URL) and `TRADING_LAB_CRON_SECRET` (the same value configured in the deployed app).

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

## V65.6 UX PATCH
- Replaced double-ring help icons with one plain inline i glyph.
- Desktop help opens beside the clicked metric; mobile uses a bounded bottom sheet.
- Buy qualification now explains score, threshold, and exactly which gate is below requirement.
