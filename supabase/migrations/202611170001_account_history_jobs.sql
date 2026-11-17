begin;
-- Evidence and publication are server-only. Clients may inspect only their own
-- job; they cannot submit fabricated evidence or acquire/publish worker leases.
create table public.auryn_account_history_jobs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 revision integer not null check(revision>0),
 ledger_snapshot jsonb not null check(jsonb_typeof(ledger_snapshot)='array' and jsonb_array_length(ledger_snapshot)<=5000 and octet_length(ledger_snapshot::text)<=2000000),
 through date not null,
 algorithm_version text not null check(length(algorithm_version) between 1 and 80),
 state jsonb not null check(jsonb_typeof(state)='object' and octet_length(state::text)<=4194304),
 result jsonb check(result is null or (jsonb_typeof(result)='object' and octet_length(result::text)<=4194304)),
 lease_token uuid,
 lease_until timestamptz,
 expires_at timestamptz not null default now()+interval '24 hours',
 updated_at timestamptz not null default now(),
 unique(user_id,revision,through,algorithm_version),
 check((lease_token is null)=(lease_until is null))
);
alter table public.auryn_account_history_jobs enable row level security;
revoke all on public.auryn_account_history_jobs from public,anon,authenticated;
grant select on public.auryn_account_history_jobs to authenticated;
grant all on public.auryn_account_history_jobs to service_role;
create policy auryn_account_history_jobs_own on public.auryn_account_history_jobs
 for select to authenticated using(user_id=(select auth.uid()));
create index auryn_account_history_jobs_expiry on public.auryn_account_history_jobs(expires_at);

-- Lock ledger before job in BOTH operations. A competing ledger edit cannot
-- commit between revision validation and lease acquisition/publication.
create function public.auryn_claim_account_history(p_id uuid,p_user uuid,p_revision integer)
returns setof public.auryn_account_history_jobs
language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 perform 1 from public.auryn_transaction_ledgers
 where user_id=p_user and revision=p_revision
 and rows=(select j.ledger_snapshot from public.auryn_account_history_jobs j
           where j.id=p_id and j.user_id=p_user and j.revision=p_revision)
 for share;
 if not found then return; end if;
 return query
 update public.auryn_account_history_jobs j
 set lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '90 seconds',updated_at=clock_timestamp()
 where j.id=p_id and j.user_id=p_user and j.revision=p_revision
 and j.expires_at>clock_timestamp() and j.result is null
 and (j.lease_until is null or j.lease_until<=clock_timestamp())
 returning j.*;
end $$;

create function public.auryn_save_account_history(
 p_id uuid,p_user uuid,p_revision integer,p_lease uuid,p_state jsonb,p_result jsonb default null
) returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
declare n integer;
begin
 perform 1 from public.auryn_transaction_ledgers
 where user_id=p_user and revision=p_revision
 and rows=(select j.ledger_snapshot from public.auryn_account_history_jobs j
           where j.id=p_id and j.user_id=p_user and j.revision=p_revision)
 for share;
 if not found then return false; end if;
 update public.auryn_account_history_jobs j
 set state=p_state,result=p_result,lease_token=null,lease_until=null,updated_at=clock_timestamp()
 where j.id=p_id and j.user_id=p_user and j.revision=p_revision
 and j.lease_token=p_lease and j.lease_until>clock_timestamp()
 and j.expires_at>clock_timestamp() and j.result is null;
 get diagnostics n=row_count;
 return n=1;
end $$;
revoke all on function public.auryn_claim_account_history(uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.auryn_save_account_history(uuid,uuid,integer,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.auryn_claim_account_history(uuid,uuid,integer) to service_role;
grant execute on function public.auryn_save_account_history(uuid,uuid,integer,uuid,jsonb,jsonb) to service_role;
commit;
