-- Server-only market data, never portfolio or account payloads.
create schema if not exists auryn_product_private;
create table if not exists auryn_product_private.market_cache (
 key text primary key, payload jsonb, expires_at timestamptz not null default '-infinity',
 lease uuid, lease_until timestamptz not null default '-infinity', updated_at timestamptz not null default now()
);
create index if not exists market_cache_expiry on auryn_product_private.market_cache(expires_at);
create table if not exists auryn_product_private.market_days (
 provider text not null, day date not null, used integer not null default 0, blocked_until timestamptz not null default '-infinity', primary key(provider,day)
);
create table if not exists auryn_product_private.market_user_days (
 user_id uuid not null, day date not null, used integer not null default 0, primary key(user_id,day)
);
create table if not exists auryn_product_private.market_stream_owner (
 provider text primary key, owner uuid not null, expires_at timestamptz not null
);
alter table auryn_product_private.market_cache enable row level security;
alter table auryn_product_private.market_days enable row level security;
alter table auryn_product_private.market_user_days enable row level security;
alter table auryn_product_private.market_stream_owner enable row level security;
revoke all on auryn_product_private.market_cache,auryn_product_private.market_days,auryn_product_private.market_user_days,auryn_product_private.market_stream_owner from public,anon,authenticated;
grant usage on schema auryn_product_private to service_role;
grant select,insert,update,delete on auryn_product_private.market_cache,auryn_product_private.market_days,auryn_product_private.market_user_days,auryn_product_private.market_stream_owner to service_role;

create or replace function public.auryn_market_acquire(p_key text,p_provider text,p_cost integer,p_cap integer,p_remote_used integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c auryn_product_private.market_cache%rowtype;u integer;ticket uuid;d date:=(clock_timestamp() at time zone 'UTC')::date;
begin
 if length(p_key)>200 or length(p_provider)>100 or p_cost<1 or p_cost>10000 or p_cap<0 or p_remote_used<0 then raise exception 'Invalid market reservation';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_provider,0));
 select * into c from auryn_product_private.market_cache where key=p_key for update;
 if c.payload is not null and c.expires_at>clock_timestamp() then return jsonb_build_object('status','cached','value',c.payload);end if;
 if c.lease is not null and c.lease_until>clock_timestamp() then return jsonb_build_object('status','wait');end if;
 insert into auryn_product_private.market_days(provider,day,used) values(p_provider,d,p_remote_used) on conflict do nothing;
 select greatest(used,p_remote_used) into u from auryn_product_private.market_days where provider=p_provider and day=d for update;
 if exists(select 1 from auryn_product_private.market_days where provider=p_provider and day=d and blocked_until>clock_timestamp()) then return jsonb_build_object('status','paused');end if;
 if u+p_cost>p_cap then return jsonb_build_object('status','limited');end if;
 update auryn_product_private.market_days set used=u+p_cost where provider=p_provider and day=d;
 ticket:=gen_random_uuid();
 insert into auryn_product_private.market_cache(key,lease,lease_until) values(p_key,ticket,clock_timestamp()+interval '30 seconds')
 on conflict(key) do update set lease=ticket,lease_until=clock_timestamp()+interval '30 seconds';
 delete from auryn_product_private.market_cache where key in(select key from auryn_product_private.market_cache where expires_at<clock_timestamp()-interval '7 days' and lease_until<clock_timestamp() limit 10);
 return jsonb_build_object('status','reserved','lease',ticket,'used',u+p_cost,'cap',p_cap);
end $$;

create or replace function public.auryn_market_publish(p_key text,p_lease uuid,p_value jsonb,p_ttl integer)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_ttl<0 or p_ttl>86400 then raise exception 'Invalid cache duration';end if;
 update auryn_product_private.market_cache set payload=case when pg_column_size(p_value)<=5242880 then p_value else null end,
 expires_at=case when p_value is not null and pg_column_size(p_value)<=5242880 then clock_timestamp()+make_interval(secs=>p_ttl) else '-infinity'::timestamptz end,
 lease=null,lease_until='-infinity',updated_at=clock_timestamp()
 where key=p_key and lease=p_lease;
 return found;
end $$;

create or replace function public.auryn_market_user_allow(p_user uuid,p_cap integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare d date:=(clock_timestamp() at time zone 'UTC')::date;u integer;
begin
 if p_cap<1 or p_cap>100000 then raise exception 'Invalid user allowance';end if;
 insert into auryn_product_private.market_user_days(user_id,day) values(p_user,d) on conflict do nothing;
 select used into u from auryn_product_private.market_user_days where user_id=p_user and day=d for update;
 if u>=p_cap then return false;end if;
 update auryn_product_private.market_user_days set used=u+1 where user_id=p_user and day=d;
 delete from auryn_product_private.market_user_days where day<d-7;
 return true;
end $$;

create or replace function public.auryn_market_stream_lease(p_provider text,p_owner uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 insert into auryn_product_private.market_stream_owner(provider,owner,expires_at) values(p_provider,p_owner,clock_timestamp()+interval '70 seconds')
 on conflict(provider) do update set owner=p_owner,expires_at=clock_timestamp()+interval '70 seconds'
 where auryn_product_private.market_stream_owner.expires_at<clock_timestamp() or auryn_product_private.market_stream_owner.owner=p_owner;
 return found;
end $$;
revoke all on function public.auryn_market_acquire(text,text,integer,integer,integer),public.auryn_market_publish(text,uuid,jsonb,integer),public.auryn_market_user_allow(uuid,integer),public.auryn_market_stream_lease(text,uuid) from public,anon,authenticated;
grant execute on function public.auryn_market_acquire(text,text,integer,integer,integer),public.auryn_market_publish(text,uuid,jsonb,integer),public.auryn_market_user_allow(uuid,integer),public.auryn_market_stream_lease(text,uuid) to service_role;

create or replace function public.auryn_market_pause(p_provider text,p_seconds integer)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_seconds<1 or p_seconds>86400 then raise exception 'Invalid backoff';end if;
 insert into auryn_product_private.market_days(provider,day,blocked_until) values(p_provider,(clock_timestamp() at time zone 'UTC')::date,clock_timestamp()+make_interval(secs=>p_seconds))
 on conflict(provider,day) do update set blocked_until=greatest(auryn_product_private.market_days.blocked_until,excluded.blocked_until);
end $$;
revoke all on function public.auryn_market_pause(text,integer) from public,anon,authenticated;
grant execute on function public.auryn_market_pause(text,integer) to service_role;
