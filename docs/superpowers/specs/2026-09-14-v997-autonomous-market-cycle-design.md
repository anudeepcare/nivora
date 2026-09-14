# AURYN V9.9.7 Autonomous Market Cycle + Reliable Queue Design

## Goals
1. Stop recurring Calibration Maturation failures by standardizing all automation on the already-configured `AURYN_BASE_URL` and `CRON_SECRET` repository secrets.
2. Make each GitHub wake-up drain as much safe validation work as possible instead of stopping after a fixed 10 stocks.
3. Collect immutable diversified cohorts across the market lifecycle: PREMARKET, LIVE_OPEN, LIVE_MIDDAY, LIVE_POWER_HOUR, DAILY_CLOSE, AFTER_HOURS, NIGHTLY, WEEKLY.
4. Rotate cohorts deterministically by date/session while retaining exchange stratification and equity eligibility.
5. Keep Supabase provider budget (42 calls/minute) authoritative. No parallel provider blasting.
6. Keep `vercel.json` exactly `{}` and do not alter CIO formulas, thresholds, research algorithms, UX, themes, or production user behavior.

## Reliable execution
GitHub cron is treated only as an imprecise wake-up signal. Each invocation:
- asks the orchestrator to create the currently eligible market-session run(s);
- drains durable Supabase work for a bounded wall-clock duration;
- if provider budget returns `deferred`, waits for the next provider minute and resumes within the same GitHub invocation;
- runs watchdog and strict evidence finalizer before exit.

## Session cohorts
- PREMARKET: 100
- LIVE_OPEN: 100
- LIVE_MIDDAY: 100
- LIVE_POWER_HOUR: 100
- DAILY_CLOSE: 300
- AFTER_HOURS: 100
- NIGHTLY: 50
- WEEKLY: 300

The cohort seed is `evaluationDate:runKind`, so selection rotates without alphabet bias while remaining reproducible.

## Scheduling windows (America/Chicago)
Windows are deliberately broad to tolerate delayed GitHub scheduled starts.
- PREMARKET: weekdays 05:00–08:29
- LIVE_OPEN: weekdays 08:30–10:29
- LIVE_MIDDAY: weekdays 10:30–13:29
- LIVE_POWER_HOUR: weekdays 13:30–14:59
- DAILY_CLOSE: weekdays 15:00–17:59
- AFTER_HOURS: weekdays 18:00–21:59
- NIGHTLY: 22:00–23:59
- WEEKLY: Saturday 08:00–13:59

## Invariants
- Current Attempt 3 continues; no restart.
- One symbol per durable validation job.
- V9.9.6.1 orphan quarantine remains.
- Strict finalizer remains.
- No PASS unless expected distinct complete Shadow CIO evidence exists.
