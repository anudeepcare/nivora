begin;
-- Optional public observation publishing only; app calculation does not require this patch.
-- Preserve append-only privileges, timestamps and existing policy-version records.
alter table public.auryn_public_pace_records
 drop constraint if exists auryn_public_pace_records_policy_check;
alter table public.auryn_public_pace_records
 add constraint auryn_public_pace_records_policy_check
 check (policy in ('monthly-v5','monthly-v6','monthly-v7'));
commit;
