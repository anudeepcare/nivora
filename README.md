# AURYN V5 Decision OS

AURYN V5 is a canonical investment-decision and paper-execution platform. It preserves the proven Market Truth, portfolio, calibration and Alpaca-paper infrastructure, but replaces competing stock-page verdicts and independently calculated price levels with one immutable V5 analysis snapshot.

## V5 canonical decision contract

Every stock surface follows one chain:

`Market Truth -> Canonical Evidence -> Professional Metrics / Patterns -> Scenario Map -> AURYN CIO -> One Decision -> One Execution Plan -> Paper Broker Gate`.

Core V5 rules:

- One primary action: `STRONG_BUY`, `BUY`, `HOLD`, `REDUCE`, `SELL`, or `INSUFFICIENT_EVIDENCE`.
- Separate NOW, SWING, 6–12M and 3–5Y horizon calls.
- Separate new-money and existing-owner guidance.
- Technical weakness changes timing/sizing; it does not independently break an intact long-term thesis.
- SELL requires structural deterioration, a hard veto, or materially negative expected-return evidence.
- Missing metrics remain `N/A`; unsupported valuation is never converted into `0/100` bearish certainty.
- Entry, DCA1/2/3, confirmation, invalidation and targets come from one V5 `ExecutionPlan`.
- All stock tabs explain the same V5 snapshot; they do not calculate a second verdict.
- If Market Truth is unverified, price-sensitive output and paper execution fail closed.

## Professional metric and setup engine

Extreme Pro exposes interpreted evidence across trend, momentum, volume/flow, volatility, structure, relative strength, business quality, fundamentals, valuation, thesis/moat, catalysts/sector and risk. Current V5 technical evidence includes RSI, MACD, stochastic, CCI, MFI, CMF, OBV slope, ROC, ATR, realized volatility, Bollinger position/width, Keltner position, squeeze state, Donchian position, ADX/DMI, Ichimoku cloud context, 20/50/200-day positioning, anchored VWAP, approximate volume-profile POC, relative volume, drawdown and benchmark-relative strength where the underlying data exist.

The pattern/scenario layer detects deterministic structure such as early/confirmed reversals, higher-low behavior, bases, breakout states and double-bottom candidates, then produces bull/base/bear scenarios. Elliott-style wave context is supporting and explicitly non-deterministic.

## Analysis depth

- **Beginner** — the V5 call, plain-English reasons and what to do.
- **Pro** — the same call plus key factors, scenario and execution context.
- **Extreme Pro** — the same call plus grouped professional metrics, source scope and technical diagnostics.

Changing depth never changes the underlying decision. Developer engine/model identifiers are not shown in the normal decision UI.

## Validation and execution status

AURYN V5 remains **Alpaca Paper only** for autonomous execution. The paper runner can consume V5 snapshot/action metadata, but live-money automatic execution is intentionally disabled. Broker execution requires market-data/risk gates and must correspond to the snapshot that generated the intent.

V5 includes a deterministic 16,384-case reliability matrix covering price verification, valuation availability, thesis state, risk, timing, ownership, company strength, macro/lifecycle and liquidity combinations. This is a software/invariant stress harness, not proof of future investment profitability.

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
