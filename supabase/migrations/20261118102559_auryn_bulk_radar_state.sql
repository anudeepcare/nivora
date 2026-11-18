-- Opt-in bulk radar only. Public market data, credential-hash scoped; never holdings/users/secrets.
begin;
create table public.auryn_bulk_radar_state (
 scope text not null check(scope ~ '^[a-f0-9]{64}$'),
 symbol text not null check(symbol ~ '^[A-Z][A-Z0-9.-]{0,14}$'),
 revision integer not null default 0 check(revision>=0),
 snapshot jsonb,
 lease_token uuid,
 lease_until timestamptz,
 issue text check(issue in ('provider_unavailable','invalid_data','budget_exhausted','history_unavailable')),
 retry_at timestamptz,
 touched_at timestamptz not null default clock_timestamp(),
 primary key(scope,symbol),
 check(snapshot is null or (jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=262144))
);
alter table public.auryn_bulk_radar_state enable row level security;
revoke all on public.auryn_bulk_radar_state from public,anon,authenticated;
grant select,insert,update,delete on public.auryn_bulk_radar_state to service_role;
create index auryn_bulk_radar_retention on public.auryn_bulk_radar_state(touched_at);
create function public.auryn_bulk_radar_claim(p_scope text,p_symbol text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare r public.auryn_bulk_radar_state;
begin
 insert into public.auryn_bulk_radar_state(scope,symbol) values(p_scope,p_symbol) on conflict do nothing;
 update public.auryn_bulk_radar_state s set lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '90 seconds',touched_at=clock_timestamp()
 where s.scope=p_scope and s.symbol=p_symbol and (s.lease_until is null or s.lease_until<=clock_timestamp()) and (s.retry_at is null or s.retry_at<=clock_timestamp()) returning * into r;
 if not found then return null; end if;
 return jsonb_build_object('token',r.lease_token,'revision',r.revision);
end $$;
create function public.auryn_bulk_radar_publish(p_scope text,p_symbol text,p_token uuid,p_revision integer,p_snapshot jsonb)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or octet_length(p_snapshot::text)>262144
 or (p_snapshot->>'symbol') is distinct from p_symbol
 or (p_snapshot->>'policy') is distinct from 'raw-splits-v1'
 or jsonb_typeof(p_snapshot->'raw') is distinct from 'array'
 or jsonb_typeof(p_snapshot->'splits') is distinct from 'array' then raise exception 'Invalid bulk radar snapshot'; end if;
 if jsonb_array_length(p_snapshot->'raw') not between 1 and 160 or jsonb_array_length(p_snapshot->'splits')>256 then raise exception 'Invalid bulk radar snapshot size'; end if;
 if coalesce(p_snapshot->>'observedThrough','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(p_snapshot->>'checkedThrough','') !~ '^\d{4}-\d{2}-\d{2}$'
 or coalesce(p_snapshot->>'historyAcquiredAt','')='' or coalesce(p_snapshot->>'actionsAcquiredAt','')='' then raise exception 'Missing bulk radar provenance'; end if;
 if exists(select 1 from jsonb_object_keys(p_snapshot) k where k not in ('symbol','policy','raw','splits','historyAcquiredAt','actionsAcquiredAt','observedThrough','checkedThrough')) then raise exception 'Unexpected bulk radar metadata'; end if;
 -- Structured primitives only: no arbitrary provider payloads, account data, or secrets.
 if exists(select 1 from jsonb_array_elements(p_snapshot->'raw') r where jsonb_typeof(r)<>'object' or
   not (r ?& array['date','open','high','low','close','volume']) or
   exists(select 1 from jsonb_object_keys(r) k where k not in ('date','open','high','low','close','volume')) or
   coalesce(r->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' or
   exists(select 1 from unnest(array['open','high','low','close','volume']) k where jsonb_typeof(r->k) is distinct from 'number'))
 then raise exception 'Invalid bulk radar raw bars'; end if;
 if exists(select 1 from jsonb_array_elements(p_snapshot->'splits') r where jsonb_typeof(r)<>'object' or
   not (r ?& array['date','split']) or exists(select 1 from jsonb_object_keys(r) k where k not in ('date','split')) or
   coalesce(r->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(r->>'split','') !~ '^[0-9]+(\.[0-9]+)?/[0-9]+(\.[0-9]+)?$')
 then raise exception 'Invalid bulk radar splits'; end if;
 if (p_snapshot->>'observedThrough')::date>(p_snapshot->>'checkedThrough')::date or
 (p_snapshot->>'checkedThrough')::date>current_date or
 (p_snapshot->>'historyAcquiredAt')::timestamptz>clock_timestamp() or
 (p_snapshot->>'actionsAcquiredAt')::timestamptz>clock_timestamp()
 then raise exception 'Invalid bulk radar provenance'; end if;
 update public.auryn_bulk_radar_state s set snapshot=p_snapshot,revision=s.revision+1,lease_token=null,lease_until=null,issue=null,retry_at=null,touched_at=clock_timestamp()
 where s.scope=p_scope and s.symbol=p_symbol and s.lease_token=p_token and s.lease_until>clock_timestamp() and s.revision=p_revision;
 return found;
end $$;
create function public.auryn_bulk_radar_fail(p_scope text,p_symbol text,p_token uuid,p_issue text,p_retry_at timestamptz)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if p_issue is null or p_issue not in ('provider_unavailable','invalid_data','budget_exhausted','history_unavailable') or p_retry_at is null or p_retry_at<clock_timestamp() or p_retry_at>clock_timestamp()+interval '1 day' then raise exception 'Invalid bulk radar retry'; end if;
 update public.auryn_bulk_radar_state s set lease_token=null,lease_until=null,issue=p_issue,retry_at=p_retry_at,touched_at=clock_timestamp()
 where s.scope=p_scope and s.symbol=p_symbol and s.lease_token=p_token and s.lease_until>clock_timestamp();
 return found;
end $$;
-- Explicit bounded maintenance only; no schedule is installed. Inactive public market snapshots are rebuildable.
create function public.auryn_bulk_radar_prune()
returns integer language plpgsql security invoker set search_path=pg_catalog,public as $$
declare n integer;
begin
 delete from public.auryn_bulk_radar_state where (scope,symbol) in (
 select scope,symbol from public.auryn_bulk_radar_state
 where touched_at<clock_timestamp()-interval '30 days' and (lease_until is null or lease_until<=clock_timestamp())
 order by touched_at limit 1000 for update skip locked);
 get diagnostics n=row_count; return n;
end $$;
revoke all on function public.auryn_bulk_radar_claim(text,text),public.auryn_bulk_radar_publish(text,text,uuid,integer,jsonb),public.auryn_bulk_radar_fail(text,text,uuid,text,timestamptz),public.auryn_bulk_radar_prune() from public,anon,authenticated;
grant execute on function public.auryn_bulk_radar_claim(text,text),public.auryn_bulk_radar_publish(text,text,uuid,integer,jsonb),public.auryn_bulk_radar_fail(text,text,uuid,text,timestamptz),public.auryn_bulk_radar_prune() to service_role;
commit;
