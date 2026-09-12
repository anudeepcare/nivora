# AURYN V9.9 — Supabase Setup

You only need to do this once.

## 1. Open Supabase SQL Editor
Open the Supabase project used by AURYN, choose **SQL Editor → New query**.

## 2. Run the migration
Copy the complete contents of:

`supabase/migrations/20260912090000_auryn_v99_validation_lab.sql`

Paste it into the SQL Editor and press **Run**.

Expected result: `Success. No rows returned`.

The migration creates:
- `auryn_model_registry`
- `auryn_validation_runs`
- `auryn_validation_jobs`
- `auryn_validation_universe`
- `auryn_shadow_snapshots`
- `auryn_shadow_outcomes`
- `auryn_model_health`
- `auryn_provider_rate_buckets`
- `auryn_acquire_provider_tokens(...)`
- `auryn_lease_validation_job(...)`

It also registers `auryn-v9.8` as the initial human-approved CHAMPION and seeds up to 300 symbols from the existing `nivora_market_universe` when that table exists.

## 3. Quick database verification
Run:

```sql
select count(*) as validation_universe from public.auryn_validation_universe;
select * from public.auryn_model_registry order by created_at desc;
select public.auryn_acquire_provider_tokens(1,42) as rate_budget_test;
```

The universe should ideally be close to 300. If it is below 250, that is okay for the first deployment: the orchestrator automatically tries to top it up from `nivora_market_universe`.

## 4. Do not manually edit shadow history
`auryn_shadow_snapshots` is intended to be append-only evidence. A duplicate model/symbol/date/run-kind is rejected by the database unique key.
