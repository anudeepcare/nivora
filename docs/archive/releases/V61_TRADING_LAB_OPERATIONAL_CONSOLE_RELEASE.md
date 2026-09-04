# NIVORA V61 Trading Lab Operational Console

This patch builds on the verified V61 Today/snapshot pipeline and does not change V59 thesis weights or V60 Today thresholds.

## What changed
- Trading Lab version bumped to `v61-trading-lab-2`.
- Every paper-cycle evaluation is persisted, including NO_INTENT, BLOCKED, DUPLICATE and SUBMITTED states.
- New recent-decisions operational table in Trading Lab: symbol, Today action, result, risk/order state, reason and time.
- Dashboard refreshes every 15 seconds.
- SELL/TRIM decisions may create risk-reducing intents even when Today is blocked; blocked BUY/ADD can never add risk.
- SELL/TRIM with no Alpaca paper position explains `No paper position exists to exit.`
- Funnel counts are derived from actual persisted evaluations rather than assuming every snapshot became an intent.
- Order/fill state and realized P&L are surfaced when available.
- Audit persistence errors fail loudly and the dashboard reports when its migration is missing.

## Required migration
Run this once in the NIVORA Supabase project before enabling the patched paper cycle:

`supabase/20260901_nivora_v61_trading_lab_console.sql`

## Verification
`npm test` passes 70/70 tests, including all prior V54-V61 invariants plus the new operational-console, no-position explanation, and risk-reducing blocked-SELL contracts.

The release ZIP does not include `.env.local`, `node_modules`, `.next`, `.git`, macOS metadata, or broker credentials.
