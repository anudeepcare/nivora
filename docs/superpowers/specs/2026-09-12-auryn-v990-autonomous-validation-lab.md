# AURYN V9.9 — Autonomous Validation Lab

## Goal
Run AURYN's proof system continuously on Vercel + Supabase with minimal human intervention, while preserving interactive user capacity and never allowing validation jobs to mutate production investment logic.

## Canonical baseline
- V9.8 Three-Clock Valuation is the frozen engine baseline.
- UX is locked.
- Provider plan allows 55 external API calls/minute with unlimited total volume.
- Background validation operating budget is 42 calls/minute, leaving headroom for interactive traffic.
- Initial shadow universe target is approximately 300 diverse U.S.-listed securities.

## Architecture
Vercel Cron triggers a lightweight orchestrator. The orchestrator creates durable runs/jobs in Supabase rather than processing the full universe synchronously. Workers lease small batches, respect a global token budget, run the canonical engine, and append immutable Shadow CIO snapshots. Separate jobs evaluate outcomes and model health.

## Core subsystems
1. Golden Fixture Lab
2. Three-Clock Shock Lab
3. Market Session Matrix
4. Market Truth invariants
5. Decision Distribution Audit
6. Valuation Anchoring / Independence Audit
7. Shadow CIO immutable snapshot store
8. Outcome evaluation at 1W / 1M / 3M / 6M / 1Y and later horizons
9. Job watchdog, retry, idempotency and stale-run recovery
10. Champion vs Challenger comparison
11. Daily model-health / PASS-WATCH-FAIL report
12. Portable `AURYN_CANONICAL_CONTEXT.md`

## Safety and governance
- Validation may observe and recommend; it may not automatically promote a challenger or modify production weights.
- Production model promotion is explicitly human-approved.
- Background jobs use idempotency keys and append-only prediction snapshots.
- A failed batch retries independently.
- Interactive traffic has priority over background provider usage.
- Background token bucket target: 42/minute.
- Missing/stale data is recorded as evidence quality degradation, not silently imputed as bearish.
- Every validation run records engine version and fingerprints.

## Scheduling
Recommended initial production schedule:
- Weekdays 07:15 America/Chicago: premarket session validation
- Weekdays 15:20 America/Chicago: regular-close shadow run orchestration
- Weekdays 18:30 America/Chicago: after-hours/session integrity validation
- Daily 23:15 America/Chicago: nightly deterministic validation + watchdog
- Saturday 09:00 America/Chicago: weekly model-health aggregation

Vercel cron itself is UTC; routes perform market/session/date guards so daylight-saving shifts do not silently run an incorrect canonical close.

## Persistence
Supabase tables:
- auryn_validation_runs
- auryn_validation_jobs
- auryn_shadow_snapshots
- auryn_shadow_outcomes
- auryn_model_health
- auryn_model_registry
- auryn_validation_universe

Prediction snapshots are append-only by application policy and protected with unique `(model_version, symbol, evaluation_date, run_kind)` keys.

## Rate-limit design
A database-backed minute bucket coordinates all background workers:
- max configured provider budget: 55/min
- background cap: 42/min
- batch workers acquire tokens before provider work
- 429/transient failures use exponential retry
- background jobs return/defer when budget is unavailable

## Validation report
Every completed validation run produces deterministic machine-readable JSON:
- correctness
- session integrity
- three-clock isolation
- valuation independence
- action reachability/distribution
- failed/warning checks
- universe processed/failed
- engine/model versions
- fingerprint
- status PASS/WATCH/FAIL

## Continuity
Every release ZIP contains `AURYN_CANONICAL_CONTEXT.md` with:
- current canonical version
- locked product principles
- architecture
- provider constraints
- completed validation status
- unresolved limitations
- next milestone
