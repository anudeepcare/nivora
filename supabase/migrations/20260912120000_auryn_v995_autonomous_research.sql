begin;
update public.auryn_validation_jobs
set status='FAILED',error='V9.9.4_SMOKE_SUPERSEDED_BY_V9.9.5',lease_expires_at=null
where run_id='39f90858-3ab9-4840-aa3e-99200c867f63'::uuid and status in ('PENDING','RUNNING');
update public.auryn_validation_runs
set status='FAIL',completed_at=now(),
 report=jsonb_build_object('invalidated',true,'reason','V9.9.4 smoke proved untouched symbols require autonomous canonical research.','supersededBy','V9.9.5')
where id='39f90858-3ab9-4840-aa3e-99200c867f63'::uuid and status='RUNNING';
commit;
