-- Shared fixed-window request limits; only trusted server code may reserve usage.
begin;
create table if not exists public.auryn_request_limits (
 key text primary key check(length(key)=64),
 count integer not null check(count>0),
 expires_at timestamptz not null
);
alter table public.auryn_request_limits enable row level security;
revoke all on public.auryn_request_limits from public,anon,authenticated;
grant all on public.auryn_request_limits to service_role;
create index if not exists auryn_request_limits_expiry on public.auryn_request_limits(expires_at);
create or replace function public.auryn_request_allow(p_key text,p_max integer,p_window_ms integer)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
declare used integer; at_time timestamptz := clock_timestamp();
begin
 if length(p_key)<>64 or p_max<1 or p_max>100000 or p_window_ms<1000 or p_window_ms>86400000 then
  raise exception 'Invalid request limit';
 end if;
 insert into public.auryn_request_limits(key,count,expires_at)
 values(p_key,1,at_time+p_window_ms*interval '1 millisecond')
 on conflict(key) do update set
 count=case when auryn_request_limits.expires_at<=at_time then 1 else least(auryn_request_limits.count+1,p_max+1) end,
 expires_at=case when auryn_request_limits.expires_at<=at_time then at_time+p_window_ms*interval '1 millisecond' else auryn_request_limits.expires_at end
 returning count into used;
 -- Bounded cleanup; no raw account or IP identifiers are stored.
 delete from public.auryn_request_limits where key in(select key from public.auryn_request_limits where expires_at<at_time-interval '1 day' limit 100);
 return used<=p_max;
end $$;
revoke all on function public.auryn_request_allow(text,integer,integer) from public,anon,authenticated;
grant execute on function public.auryn_request_allow(text,integer,integer) to service_role;
commit;

