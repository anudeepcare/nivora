# Saved thesis scheduling

A saved note explicitly opts in with `monitorEnabled: "true"`. The existing account-owned document policies govern this choice. Saving, disabling, or deleting the note synchronizes its private queue row through the installed database trigger. This is the same explicit condition-monitoring switch used by manual checks; it does not infer conditions from free text. Existing enabled conditions were backfilled by the already-installed migration.

The separate protected `/api/jobs/theses` endpoint runs the queue only when `AURYN_THESIS_JOB_ENABLED=true`. Default/unset is disabled. Alerts and paper jobs retain their existing owner restrictions. The production flag is enabled. `vercel.json` configures a daily 14:00 UTC invocation, authenticated automatically with the existing production CRON_SECRET. The Hobby schedule may run within the following hour. Deployment activates the schedule; the first scheduled execution must still be observed. The legacy `/api/jobs` endpoint does not run thesis work, so provider latency cannot delay its other jobs.

Each run leases at most four due conditions for five minutes. Oldest due conditions go first, with account and symbol tie-breakers. A successful check moves the condition forward 24 hours; unavailable evidence, denied access, and failures retry after 15 minutes. Leased rows are skipped by other workers. Failures in one account do not stop the remaining claimed work. This provides eventual due-date fairness, not a fixed one-item-per-account quota. A process killed before finishing relies on lease expiration.

Current account access must permit financials and market data before evidence retrieval. Reads use the claimed account and symbol. Scheduled review events use the installed atomic publication RPC, which locks and verifies the current enabled note revision and unexpired lease before inserting. Event identity includes the normalized condition and measured financial period/value; duplicate evidence does not create duplicate alerts. An expired, disabled, edited, or cross-account claim cannot publish.

Manual checks remain authenticated and account-scoped. They re-read the current condition immediately before writing, rejecting changed or disabled conditions; unlike scheduled publication, this manual read/write pair is not one database transaction.

Validation includes worker behavior tests, current-rule races during research, and local PostgreSQL-compatible execution of the exact recovered installed queue migration. No due rows existed during release inspection. Production provider delivery still requires an opted-in eligible condition and an observed successful scheduled run.

## Required release migration
Apply `20261107150947_auryn_thesis_source_guard.sql` before activating the restored scheduler. It binds scheduled publication to the exact original note body even when a client preserves updated_at, and checks wall-clock lease expiry after acquiring the queue lock. This follow-up was applied to production on 7 November 2026. Read-back confirmed the exact-body guard and wall-clock lease check; authenticated members cannot invoke the publication RPC directly.

## Current capacity
The daily schedule is an initial activation, not a 15-minute service guarantee. Each invocation processes at most four conditions. A retry becomes eligible after 15 minutes but waits for the next invocation. Higher volume or faster retries require a scheduler with a higher supported frequency.
