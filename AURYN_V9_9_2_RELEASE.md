# AURYN V9.9.2 — Immutable Validation Run Lifecycle

V9.9.2 fixes same-day retry identity.

## Root cause
V9.9/V9.9.1 used `(run_kind, evaluation_date, model_version)` as the unique run identity. An orchestrator retry therefore upserted into a terminal FAIL run, changing it back to RUNNING while its old jobs remained DONE/FAILED.

## Contract
- PASS/FAIL/FAILED/CANCELLED runs are immutable and never resumed.
- PENDING/RUNNING runs may be resumed idempotently.
- a retry after a terminal run creates `attempt + 1` and a new UUID.
- job idempotency includes model version + attempt + batch.
- the old V9.9 smoke run remains audit evidence as attempt 1.
- no UX, CIO formula, threshold or investment-decision changes.
