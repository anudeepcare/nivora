# AURYN V9.9.6.1 — Orphan Queue Resilience

Root cause: the durable queue contained stale jobs whose `run_id` no longer existed. V9.9.6 worker marked such a job FAILED but returned HTTP 500; the queue pump treats every non-2xx as fatal, so one orphan job terminated the GitHub Action.

Fix:
- RUN_NOT_FOUND jobs are terminally quarantined and return `{status:"skipped"}` rather than HTTP 500.
- Queue pump continues after `skipped`.
- Watchdog never requeues `RUN_NOT_FOUND` jobs.
- No CIO/research/universe/UX changes.
- `vercel.json` remains `{}`.
