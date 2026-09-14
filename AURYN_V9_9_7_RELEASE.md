# AURYN V9.9.7 — Autonomous Market Cycle + Reliable Queue

## Permanent automation fixes
- Calibration Maturation now uses the already-configured GitHub repository secrets `AURYN_BASE_URL` and `CRON_SECRET`.
- Removed workflow dependency on legacy `AURYN_PRODUCTION_URL` / `TRADING_LAB_CRON_SECRET`.
- Existing maturation API routes already accept `CRON_SECRET` as a fallback, so no duplicate secret is required.

## Faster resilient validation draining
- GitHub cron is treated as an imprecise wake-up signal rather than a precise clock.
- Each wake-up drains the durable Supabase queue for up to 8 minutes / 40 jobs.
- Provider-budget `deferred` waits until the next provider minute and resumes inside the same workflow run instead of exiting immediately.
- Work remains sequential and the existing Supabase 42 calls/minute background governor remains authoritative.
- V9.9.6.1 RUN_NOT_FOUND quarantine remains.

## Full market lifecycle collection
Supported immutable session kinds:
- PREMARKET
- LIVE_OPEN
- LIVE_MIDDAY
- LIVE_POWER_HOUR
- DAILY_CLOSE
- AFTER_HOURS
- NIGHTLY
- WEEKLY

Cohorts:
- PREMARKET / each live session / AFTER_HOURS: 100
- NIGHTLY: 50
- DAILY_CLOSE / WEEKLY: 300

Cohorts are deterministically rotated using `evaluationDate:runKind` while retaining exchange stratification and common-stock/USD/US eligibility. This prevents alphabetic/A-ticker concentration and avoids using the exact same cohort every session/day.

## Scientific integrity
- Watchdog only repairs leases/retryable jobs; it no longer marks runs PASS.
- Strict evidence finalizer evaluates up to 20 RUNNING runs and is the only automated run-completion authority.
- No run can PASS without the expected number of distinct complete Shadow CIO snapshots.

## Unchanged
- Current Attempt 3 is not restarted.
- One symbol per durable job remains.
- CIO formulas, weights, thresholds, research engine, UX/themes remain unchanged.
- `vercel.json` remains exactly `{}`.
