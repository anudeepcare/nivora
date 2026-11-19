-- Shared opt-in bulk source cooldown. No user identities, symbols, raw provider errors or secrets.
begin;
create table public.auryn_bulk_radar_source (
 scope text not null check(scope ~ '^[a-f0-9]{64}$'),
 session_date date not null,
 retry_at timestamptz not null,
 primary key(scope,session_date)
);
alter table public.auryn_bulk_radar_source enable row level security;
revoke all on public.auryn_bulk_radar_source from public,anon,authenticated;
grant select,insert,update,delete on public.auryn_bulk_radar_source to service_role;
create index auryn_bulk_radar_source_expiry on public.auryn_bulk_radar_source(retry_at);
create function public.auryn_bulk_radar_source_cooldown(p_scope text,p_date date)
returns timestamptz language plpgsql security invoker set search_path=pg_catalog,public as $$
declare result timestamptz;
begin
 if p_scope is null or p_scope !~ '^[a-f0-9]{64}$' or p_date is null or not isfinite(p_date) or p_date>current_date then raise exception 'Invalid bulk source scope'; end if;
 select retry_at into result from public.auryn_bulk_radar_source where scope=p_scope and session_date=p_date and retry_at>clock_timestamp();
 return result;
end $$;
create function public.auryn_bulk_radar_source_pause(p_scope text,p_date date,p_retry_at timestamptz)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if p_scope is null or p_scope !~ '^[a-f0-9]{64}$' or p_date is null or not isfinite(p_date) or p_date>current_date
 or p_retry_at is null or not isfinite(p_retry_at) or p_retry_at<=clock_timestamp() or p_retry_at>clock_timestamp()+interval '1 day'
 then raise exception 'Invalid bulk source cooldown'; end if;
 insert into public.auryn_bulk_radar_source(scope,session_date,retry_at) values(p_scope,p_date,p_retry_at)
 on conflict(scope,session_date) do update set retry_at=greatest(auryn_bulk_radar_source.retry_at,excluded.retry_at);
 return true;
end $$;
-- Explicit retention only. Never clears an unexpired provider pause.
create function public.auryn_bulk_radar_source_prune()
returns integer language plpgsql security invoker set search_path=pg_catalog,public as $$
declare n integer;
begin
 delete from public.auryn_bulk_radar_source where (scope,session_date) in (
 select scope,session_date from public.auryn_bulk_radar_source where retry_at<=clock_timestamp()
 order by retry_at limit 1000 for update skip locked);
 get diagnostics n=row_count; return n;
end $$;
revoke all on function public.auryn_bulk_radar_source_cooldown(text,date),public.auryn_bulk_radar_source_pause(text,date,timestamptz),public.auryn_bulk_radar_source_prune() from public,anon,authenticated;
grant execute on function public.auryn_bulk_radar_source_cooldown(text,date),public.auryn_bulk_radar_source_pause(text,date,timestamptz),public.auryn_bulk_radar_source_prune() to service_role;
commit;
