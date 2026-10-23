-- Private-beta access. App owner is selected by server-only AURYN_OWNER_USER_ID.
create table if not exists public.auryn_access_config(id boolean primary key default true check(id), body jsonb not null default '{}', enforced boolean not null default false, owner_id uuid, updated_at timestamptz not null default now());
insert into public.auryn_access_config(id) values(true) on conflict do nothing;
create table if not exists public.auryn_beta_grants(user_id uuid primary key references auth.users(id) on delete cascade,email text not null,expires_at timestamptz not null,revoked_at timestamptz,cohort text not null default 'friends',reason text not null default '',updated_at timestamptz not null default now());
create table if not exists public.auryn_subscriptions(user_id uuid primary key references auth.users(id) on delete cascade,status text not null,paid_until timestamptz not null,updated_at timestamptz not null default now());
-- No public checkout or subscription writer is installed in this private-beta build.
create table if not exists public.auryn_access_usage(user_id uuid not null references auth.users(id) on delete cascade,month date not null,bucket text not null check(bucket in ('research','ai')),item text not null,created_at timestamptz not null default now(),primary key(user_id,month,bucket,item));
create table if not exists public.auryn_access_audit(id bigint generated always as identity primary key,actor uuid not null,action text not null,target uuid,body jsonb not null default '{}',created_at timestamptz not null default now());
create index if not exists auryn_access_audit_created on public.auryn_access_audit(created_at desc);
alter table public.auryn_access_config enable row level security;
alter table public.auryn_beta_grants enable row level security;
alter table public.auryn_subscriptions enable row level security;
alter table public.auryn_access_usage enable row level security;
alter table public.auryn_access_audit enable row level security;
revoke all on public.auryn_access_config,public.auryn_beta_grants,public.auryn_subscriptions,public.auryn_access_usage,public.auryn_access_audit from public,anon,authenticated;
grant select,insert,update,delete on public.auryn_access_config,public.auryn_beta_grants,public.auryn_subscriptions,public.auryn_access_usage,public.auryn_access_audit to service_role;
grant usage,select on sequence public.auryn_access_audit_id_seq to service_role;
create or replace function public.auryn_access_reserve(p_user uuid,p_bucket text,p_item text,p_limit integer) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare m date:=date_trunc('month',now() at time zone 'UTC')::date;n integer;
begin
 if p_bucket not in ('research','ai') or p_limit<0 or p_limit>1000 or length(p_item)<1 or length(p_item)>80 then raise exception 'Invalid usage reservation';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':'||m::text||':'||p_bucket,0));
 select count(*) into n from public.auryn_access_usage where user_id=p_user and month=m and bucket=p_bucket;
 if exists(select 1 from public.auryn_access_usage where user_id=p_user and month=m and bucket=p_bucket and item=p_item) then return jsonb_build_object('allowed',true,'used',n,'month',m);end if;
 if n>=p_limit then return jsonb_build_object('allowed',false,'used',n,'month',m);end if;
 insert into public.auryn_access_usage(user_id,month,bucket,item) values(p_user,m,p_bucket,p_item);
 return jsonb_build_object('allowed',true,'used',n+1,'month',m);
end $$;
create or replace function public.auryn_access_manage(p_actor uuid,p_action text,p_target uuid,p_body jsonb) returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_action='settings' then
  update public.auryn_access_config set body=p_body-'__enabled',enforced=coalesce((p_body->>'__enabled')::boolean,false),owner_id=p_actor,updated_at=now() where id=true;
 elsif p_action='grant' then
  if not exists(select 1 from auth.users where id=p_target) or (p_body->>'expiresAt')::timestamptz<=now() or (p_body->>'expiresAt')::timestamptz>now()+interval '366 days' then raise exception 'Invalid complimentary access';end if;
  insert into public.auryn_beta_grants(user_id,email,expires_at,cohort,reason) values(p_target,p_body->>'email',(p_body->>'expiresAt')::timestamptz,left(coalesce(p_body->>'cohort','friends'),40),left(coalesce(p_body->>'reason',''),240)) on conflict(user_id) do update set email=excluded.email,expires_at=excluded.expires_at,revoked_at=null,cohort=excluded.cohort,reason=excluded.reason,updated_at=now();
 elsif p_action='revoke' then
  update public.auryn_beta_grants set revoked_at=now(),updated_at=now() where user_id=p_target;
 elsif p_action='revoke-cohort' then
  if length(coalesce(p_body->>'cohort',''))<1 then raise exception 'Cohort required';end if;
  update public.auryn_beta_grants set revoked_at=now(),updated_at=now() where cohort=p_body->>'cohort';
 else raise exception 'Unknown access operation';end if;
 insert into public.auryn_access_audit(actor,action,target,body) values(p_actor,p_action,p_target,p_body);
 return true;
end $$;
create or replace function public.auryn_access_find_user(p_email text) returns table(id uuid,email text) language sql security invoker set search_path=public,pg_temp as $$select id,email::text from auth.users where lower(email)=lower(p_email) limit 1$$;
revoke all on function public.auryn_access_reserve(uuid,text,text,integer),public.auryn_access_manage(uuid,text,uuid,jsonb),public.auryn_access_find_user(text) from public,anon,authenticated;
grant execute on function public.auryn_access_reserve(uuid,text,text,integer),public.auryn_access_manage(uuid,text,uuid,jsonb),public.auryn_access_find_user(text) to service_role;
grant usage on schema auth to service_role;
grant select(id,email) on auth.users to service_role;
-- Private trigger protects caps even for direct authenticated Supabase writes.
create schema if not exists auryn_private;
revoke all on schema auryn_private from public,anon,authenticated;
create or replace function auryn_private.guard_watchlist_access()
returns trigger language plpgsql security definer set search_path='' as $$
declare cfg public.auryn_access_config%rowtype;pro boolean;cap integer;n integer;
begin
 select * into cfg from public.auryn_access_config where id=true;
 if not coalesce(cfg.enforced,false) or new.user_id=cfg.owner_id then return new;end if;
 if auth.uid() is distinct from new.user_id then raise exception 'Account ownership required' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text||':auryn-watchlist',0));
 select exists(select 1 from public.auryn_beta_grants where user_id=new.user_id and revoked_at is null and expires_at>now()) or exists(select 1 from public.auryn_subscriptions where user_id=new.user_id and status in ('active','trialing','past_due') and paid_until>now()) into pro;
 if coalesce(cfg.body->>'mode','private')='private' and not pro then raise exception 'A beta invitation is required' using errcode='42501';end if;
 cap:=coalesce((cfg.body->>(case when pro then 'proWatchlist' else 'freeWatchlist' end))::integer,case when pro then 50 else 5 end);
 if exists(select 1 from public.watchlist_items where user_id=new.user_id and symbol=new.symbol and id<>new.id) then return new;end if;
 select count(distinct symbol) into n from public.watchlist_items where user_id=new.user_id and id<>new.id;
 if n>=cap then raise exception 'Watchlist allowance reached. Remove a saved company before adding another.' using errcode='P0001';end if;
 return new;
end $$;
revoke all on function auryn_private.guard_watchlist_access() from public,anon,authenticated;
drop trigger if exists auryn_watch_access on public.watchlist_items;
create trigger auryn_watch_access before insert or update of symbol,user_id on public.watchlist_items for each row execute function auryn_private.guard_watchlist_access();
