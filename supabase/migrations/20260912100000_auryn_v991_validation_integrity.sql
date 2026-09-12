begin;

-- The first V9.9 smoke run proved infrastructure but exposed validation-layer
-- mapping/universe defects. Keep the run as operational evidence, but remove its
-- invalid Shadow CIO observations/outcomes so they cannot enter model science.
delete from public.auryn_shadow_outcomes
where snapshot_id in (
  select id from public.auryn_shadow_snapshots
  where run_id='f6a04031-a3bf-44f1-93f2-9f44cc140cd2'::uuid
);

delete from public.auryn_shadow_snapshots
where run_id='f6a04031-a3bf-44f1-93f2-9f44cc140cd2'::uuid;

update public.auryn_validation_jobs
set status='FAILED',
    error='V9.9_SMOKE_INVALIDATED_BY_V9.9.1',
    available_at=now(),
    lease_expires_at=null
where run_id='f6a04031-a3bf-44f1-93f2-9f44cc140cd2'::uuid
  and status in ('PENDING','RUNNING');

update public.auryn_validation_runs
set status='FAIL',
    failed_symbols=expected_symbols,
    completed_at=now(),
    report=jsonb_build_object(
      'invalidated',true,
      'reason','V9.9 smoke run exposed alphabetical universe and NULL canonical CIO mapping; excluded from model science.',
      'supersededBy','V9.9.1'
    )
where id='f6a04031-a3bf-44f1-93f2-9f44cc140cd2'::uuid;

-- Force the next orchestrator to rebuild the cohort from the stratified source.
update public.auryn_validation_universe set active=false;

commit;
