begin;

alter table public.auryn_validation_runs
  add column if not exists attempt integer not null default 1,
  add column if not exists run_identity text;

-- Preserve the original V9.9 smoke run as immutable attempt 1.
update public.auryn_validation_runs
set attempt=coalesce(attempt,1),
    run_identity=coalesce(run_identity,
      'auryn-v992:'||run_kind||':'||evaluation_date::text||':'||model_version||':attempt-'||lpad(coalesce(attempt,1)::text,3,'0'))
where run_identity is null;

-- The old uniqueness rule caused terminal same-day runs to be resurrected.
alter table public.auryn_validation_runs
  drop constraint if exists auryn_validation_runs_run_kind_evaluation_date_model_version_key;

drop index if exists auryn_validation_runs_run_kind_evaluation_date_model_version_key;

create unique index if not exists auryn_validation_runs_identity_uq
  on public.auryn_validation_runs(run_identity);

create unique index if not exists auryn_validation_runs_attempt_uq
  on public.auryn_validation_runs(run_kind,evaluation_date,model_version,attempt);

commit;
