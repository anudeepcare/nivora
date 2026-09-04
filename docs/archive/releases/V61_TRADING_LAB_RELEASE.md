# NIVORA V61 — Trading Lab

V61 adds a paper-trading laboratory without changing V59 thesis weights or V60 live-market semantics.

## What V61 adds
- Deterministic TradeIntent contract generated from frozen NIVORA Today decisions.
- Hard paper risk gates: daily loss, position concentration, per-trade sizing, cash reserve, maximum positions, quote freshness, spread/gap protection, duplicate suppression.
- Limit-only paper order planning with deterministic client order IDs.
- Alpaca Paper adapter hard-locked to `https://paper-api.alpaca.markets`.
- Autonomous paper cycle endpoint protected by `TRADING_LAB_CRON_SECRET` and disabled unless `TRADING_LAB_PAPER_ENABLED=true`.
- Live execution safety contract: live mode always reports `APPROVAL_REQUIRED`; Trading Lab contains no autonomous live order path.
- Supabase audit tables for intents, orders, and fills.
- Trading Lab dashboard with realized paper P&L, win rate, profit factor, expectancy, alpha and drawdown.
- Server-side broker credentials only; no keys are committed.

## Setup
1. Run `supabase/20260901_nivora_v61_trading_lab.sql`.
2. Add `ALPACA_PAPER_API_KEY`, `ALPACA_PAPER_API_SECRET`, and a strong `TRADING_LAB_CRON_SECRET` to deployment secrets.
3. Keep `TRADING_LAB_PAPER_ENABLED=false` until the paper account is ready.
4. Set it to `true` only for paper automation.
5. Schedule POST `/api/trading-lab/run-paper` with `Authorization: Bearer <TRADING_LAB_CRON_SECRET>` at the desired paper-test cadence.

V61 paper results are experiments, not evidence of guaranteed profitability. Arena/Trading Lab must accumulate realized samples before strategy quality is judged.
