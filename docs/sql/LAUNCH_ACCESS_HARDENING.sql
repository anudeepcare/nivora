-- Reviewed against the four live legacy definitions on 2026-10-23.
-- Stage first. No current-source callers; check separately deployed legacy workers.
-- No records, trigger definitions or intentional user-owned import/AI RPCs are changed.
begin;
do $block$
declare signature text;
begin
  foreach signature in array array[
    'public.auryn_acquire_provider_tokens(integer,integer)',
    'public.auryn_lease_validation_job(integer)',
    'public.handle_new_user()',
    'public.nivora_take_rate_limit(text,integer,integer)'
  ] loop
    if to_regprocedure(signature) is not null then
      execute format('revoke all privileges on function %s from public, anon, authenticated', signature);
      execute format('grant execute on function %s to service_role', signature);
    end if;
  end loop;
end
$block$;
commit;
-- Check afterward: all four must be false for anon/authenticated; service_role remains true.
select p.oid::regprocedure as function,
  has_function_privilege('anon',p.oid,'execute') as anon_can_execute,
  has_function_privilege('authenticated',p.oid,'execute') as signed_in_can_execute,
  has_function_privilege('service_role',p.oid,'execute') as server_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
  ('auryn_acquire_provider_tokens','auryn_lease_validation_job','handle_new_user','nivora_take_rate_limit');
