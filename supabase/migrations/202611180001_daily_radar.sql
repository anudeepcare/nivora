begin;
-- Private daily price-history cache, not a new research entitlement or trade log.
create table public.auryn_daily_radar (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 symbol text not null check(symbol ~ '^[A-Z][A-Z0-9.-]{0,14}$'),
 status text not null default 'pending' check(status in ('pending','ready','unavailable')),
 history jsonb not null default '[]' check(jsonb_typeof(history)='array' and jsonb_array_length(history)<=160 and octet_length(history::text)<=100000),
 observed_through date,
 checked_at timestamptz,
 issue text,
 attempts integer not null default 0,
 retry_at timestamptz,
 lease_token uuid,
 lease_until timestamptz,
 primary key(user_id,day,symbol)
);
alter table public.auryn_daily_radar enable row level security;
revoke all on public.auryn_daily_radar from public,anon,authenticated;
grant select on public.auryn_daily_radar to authenticated;
grant all on public.auryn_daily_radar to service_role;
create policy daily_radar_own on public.auryn_daily_radar for select to authenticated using(user_id=(select auth.uid()));
create function public.auryn_claim_daily_radar(p_user uuid,p_day date,p_symbol text)
returns setof public.auryn_daily_radar language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 insert into public.auryn_daily_radar(user_id,day,symbol) values(p_user,p_day,p_symbol) on conflict do nothing;
 return query update public.auryn_daily_radar r
 set lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '90 seconds',attempts=attempts+1
 where r.user_id=p_user and r.day=p_day and r.symbol=p_symbol and r.status='pending'
 and (r.retry_at is null or r.retry_at<=clock_timestamp())
 and (r.lease_until is null or r.lease_until<=clock_timestamp())
 returning r.*;
end $$;
revoke all on function public.auryn_claim_daily_radar(uuid,date,text) from public,anon,authenticated;
grant execute on function public.auryn_claim_daily_radar(uuid,date,text) to service_role;
commit;
