# NIVORA V51 — Investor Radar + Learning Ledger

V51 removes the duplicate Today/Discover experience. `/discover` redirects to `/dashboard`, and navigation exposes one **Radar** surface.

Radar has three jobs:
- **Your Money:** portfolio + watchlist symbols are background-priority names.
- **What Changed:** only stored thesis/action changes, not daily price noise.
- **Market Opportunities:** globally ranked completed thesis records; never ticker/alphabetical order.

## Required migration
Run once in Supabase:
`supabase/migrations/20260830_nivora_v51_learning_ledger.sql`

## Learning ledger
`nivora_decision_history` stores immutable daily/material-change snapshots. V51 records 3M, 6M, 1Y, 2Y and 3Y model scores so future versions can grade outcomes without rewriting history.

## Privacy-aware priority scanning
The server-side worker reads symbols from `portfolio_positions` and `watchlist_items` with the service role and prioritizes them. Private holdings are **not** hardcoded into browser/client code. A liquid public research seed makes new installs useful immediately, then the scanner continues stale-first across the eligible U.S. universe.

## Trust changes
- Bullish now requires stronger company + forward evidence; analyst Buy consensus alone cannot make a thesis Bullish.
- Weak financial/forward evidence has explicit negative vetoes.
- A technical accumulation zone is shown only when it is narrow enough to be decision-useful. Broad BTC/volatile-asset support is labeled as support, not fake precision.
- Technical timing can say overextended/do-not-chase while the long-term thesis remains Bullish.

## Automatic forward grading
Every time a priority symbol is refreshed, V51 grades frozen historical calls once they reach 1D, 7D, 30D, 90D, 180D and 365D age. Results are stored in `nivora_decision_outcomes`. This is the basis for a future audited hit-rate/calibration dashboard; it does not automatically rewrite model weights.
