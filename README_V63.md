# NIVORA V63 — Evidence & Reality Engine

V63 hardens V62 around market truth, decision explainability, calibrated evidence and verifiable paper execution.

## Market truth
- Alpaca execution quote + Twelve Data research/cross-check.
- Quote states: LIVE_VERIFIED, LIVE_SINGLE_SOURCE, DELAYED, STALE, DISAGREEMENT, MARKET_CLOSED.
- `/api/quote/[symbol]` is returned with `Cache-Control: no-store`.
- Provider timestamps remain the authority for freshness; no old price is relabeled as live.
- Automatic paper orders run only during the regular market session and also verify the Alpaca market clock.

## Decision reality
- Market/model disagreement.
- Valuation robustness + stressed bear case.
- Falling-knife/stabilization guard.
- Fast early-warning layer.
- Auditable score attribution.
- Confidence-aware price-zone rounding.
- Reality guards can withhold new BUY/ADD risk without rewriting the slow-moving long-term thesis.

## Calibration
- Exact-engine and weight-compatible evidence remain separate.
- Cohorts are segmented by archetype × horizon × benchmark regime.
- Zero matured observations display as Collecting / unavailable metrics, never as 0% measured accuracy.

## Paper trading
- Alpaca Paper only.
- GitHub Actions owns recurring execution; `vercel.json` is Hobby-safe (`{}`).
- Trading Lab checks broker connectivity and runner heartbeat.
- Secret-protected `/api/trading-lab/diagnostics` provides read-only broker/quote diagnostics.
- Optional order-path proof submits a deliberately non-marketable Alpaca PAPER limit order and immediately requests cancellation. It is not a NIVORA signal.
- SELL/TRIM may only reduce existing paper exposure. No automatic live-money route exists.

## Required GitHub configuration
Production environment secret:
- `TRADING_LAB_CRON_SECRET`

Optional repository variable:
- `NIVORA_BASE_URL` (defaults in workflow to `https://getnivora.vercel.app`)

## Required Vercel configuration
- Existing Supabase/provider keys
- `ALPACA_PAPER_API_KEY`
- `ALPACA_PAPER_API_SECRET`
- `TRADING_LAB_PAPER_ENABLED=true`
- `TRADING_LAB_CRON_SECRET`
- Keep `TRADING_LAB_SELF_TEST_ORDER_ENABLED=false` except during a deliberate one-time paper broker proof.
