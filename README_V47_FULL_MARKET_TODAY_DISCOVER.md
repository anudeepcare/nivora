# NIVORA V47 — Full-Market Today + Discover

## What changed
- Removes the seed/fallback radar from Today/Discover. Partial batches can no longer masquerade as market rankings.
- Scanner selection is stale-first with a stable hash tie-break, eliminating the A/AAC/AACO alphabetical leak.
- Discover publishes only after >=90% of the eligible universe has at least one persisted scan; while warming up it shows explicit progress.
- Once coverage exists, Discover serves the persisted globally ranked snapshot while incremental refreshes continue.
- Today remains a material-change feed: prior decision/action change or >=6-point rank move, filtered to meaningful action/risk.
- GitHub market scanner schedule is every 15 minutes on weekdays during the broad U.S. market-day UTC window, with concurrency protection.
- Adds scan-running, coverage, freshness, and completed-scan state fields.

## Required deployment step
Run `supabase/migrations/20260830_nivora_v47_scan_freshness.sql` once in Supabase SQL Editor, then deploy and manually run **NIVORA Market Scanner** once from GitHub Actions.

## API-plan reality
The 15-minute scheduler does not mean every U.S. stock is deeply rescored every 15 minutes. The current Twelve Data deep scan is intentionally rolling to respect API credits. The UI exposes coverage/freshness instead of claiming false real-time full-market coverage. Increase `NIVORA_SCAN_BATCH_SIZE` / reduce pause only when the data plan supports it.
