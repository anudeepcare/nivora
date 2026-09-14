# AURYN V9.9.7.1 — Market Price Stability + Fast Reliable Research

## Market-price stability
- One sticky live display-price authority is used across the security header and premium research overview.
- A fresh live quote upgrades the display immediately.
- A transient quote refresh/provider gap no longer downgrades the page to canonical/verified price for 90 seconds, preventing live/verified flicker.
- Out-of-order quote responses are rejected with a request sequence guard.
- Ticker changes clear the prior ticker display quote before loading the next symbol.
- After 30 seconds without a fresh quote the label becomes `RECENT LIVE PRICE`; after the 90-second grace expires the UI safely falls back to canonical market truth.
- Execution-grade price verification, CIO formulas, decisions, thresholds and risk gates remain canonical and unchanged.

## Speed/reliability
- Fast quote refresh interval is 4 seconds with shared request de-duplication/cache.
- Session quote cache can instantly restore a recent live quote during navigation/re-render without flashing to another price authority.
- Existing progressive/stale-while-revalidate research loading remains; secondary evidence does not block the first screen.
- Existing V9.9.7 autonomous market-cycle queue and 42/min background provider governor remain unchanged.

## Deployment integrity
- Both hidden GitHub workflow files are included in this release ZIP.
- `scripts/verify-v9971-release.mjs` fails deployment verification if workflows are missing, legacy maturation secrets return, Vercel cron is enabled, or a V9.9.7.1 Supabase migration appears.
- Zero Supabase migrations and zero manual SQL queries are required for V9.9.7.1.
