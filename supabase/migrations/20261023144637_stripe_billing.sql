-- Server-only Stripe bindings; a browser cannot grant itself a paid plan.
alter table public.auryn_subscriptions add column if not exists billing_mode text;
create table public.auryn_billing_customers(
 user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check(mode in ('test','live')),customer_id text not null unique,
 checkout_nonce uuid,checkout_session text,checkout_expires bigint,lease_until timestamptz,
 primary key(user_id,mode));
create table public.auryn_stripe_subscriptions(
 subscription_id text primary key,user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check(mode in ('test','live')),customer_id text not null,
 status text not null,paid_until timestamptz not null,cancel_at_period_end boolean not null,
 observed bigint not null,updated_at timestamptz not null default now());
create index on public.auryn_stripe_subscriptions(user_id,mode);
create table public.auryn_billing_events(event_id text primary key,processed_at timestamptz not null default now());
alter table public.auryn_billing_customers enable row level security;
alter table public.auryn_stripe_subscriptions enable row level security;
alter table public.auryn_billing_events enable row level security;
revoke all on public.auryn_billing_customers,public.auryn_stripe_subscriptions,public.auryn_billing_events from public,anon,authenticated;
grant select,insert,update,delete on public.auryn_billing_customers,public.auryn_stripe_subscriptions,public.auryn_billing_events to service_role;
create function public.auryn_billing_checkout_lease(p_user uuid,p_mode text) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.auryn_billing_customers;
begin
 select * into b from public.auryn_billing_customers where user_id=p_user and mode=p_mode for update;
 if not found then raise exception 'Missing billing customer';end if;
 if b.lease_until>now() then return jsonb_build_object('allowed',false);end if;
 if b.checkout_expires is null or b.checkout_expires<extract(epoch from now()) then
  b.checkout_nonce:=gen_random_uuid();b.checkout_session:=null;b.checkout_expires:=extract(epoch from now())::bigint+3600;
 end if;
 update public.auryn_billing_customers set checkout_nonce=b.checkout_nonce,checkout_session=b.checkout_session,checkout_expires=b.checkout_expires,lease_until=now()+interval '60 seconds' where user_id=p_user and mode=p_mode;
 return jsonb_build_object('allowed',true,'nonce',b.checkout_nonce,'session',b.checkout_session,'expires',b.checkout_expires);
end $$;
create function public.auryn_billing_apply(p_user uuid,p_mode text,p_customer text,p_subscription text,p_status text,p_until timestamptz,p_cancel boolean,p_observed bigint,p_event text) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_mode,0));
 if not exists(select 1 from public.auryn_billing_customers where user_id=p_user and mode=p_mode and customer_id=p_customer) then raise exception 'Customer mismatch';end if;
 insert into public.auryn_billing_events(event_id) values(p_event) on conflict do nothing;
 if not found then return;end if;
 insert into public.auryn_stripe_subscriptions(subscription_id,user_id,mode,customer_id,status,paid_until,cancel_at_period_end,observed)
 values(p_subscription,p_user,p_mode,p_customer,p_status,p_until,p_cancel,p_observed)
 on conflict(subscription_id) do update set status=excluded.status,paid_until=greatest(auryn_stripe_subscriptions.paid_until,excluded.paid_until),cancel_at_period_end=excluded.cancel_at_period_end,observed=excluded.observed,updated_at=now()
 where auryn_stripe_subscriptions.observed<=excluded.observed;
 -- Only live purchases enter the legacy projection used by direct watchlist writes.
 -- Sandbox access is resolved separately on the server, never promoted into live.
 if p_mode='live' then
  insert into public.auryn_subscriptions(user_id,status,paid_until,billing_mode)
  select p_user,coalesce((select status from public.auryn_stripe_subscriptions where user_id=p_user and mode='live' and status in ('active','trialing','past_due') order by paid_until desc limit 1),'canceled'),coalesce((select max(paid_until) from public.auryn_stripe_subscriptions where user_id=p_user and mode='live' and status in ('active','trialing','past_due')),'1970-01-01'::timestamptz),'live'
  on conflict(user_id) do update set status=excluded.status,paid_until=excluded.paid_until,billing_mode='live',updated_at=now();
 end if;
end $$;
revoke all on function public.auryn_billing_checkout_lease(uuid,text),public.auryn_billing_apply(uuid,text,text,text,text,timestamptz,boolean,bigint,text) from public,anon,authenticated;
grant execute on function public.auryn_billing_checkout_lease(uuid,text),public.auryn_billing_apply(uuid,text,text,text,text,timestamptz,boolean,bigint,text) to service_role;

-- Database-side watchlist enforcement uses the explicitly configured deployment mode.
alter table public.auryn_access_config add column if not exists billing_mode text not null default 'test' check(billing_mode in ('test','live'));
create or replace function auryn_private.guard_watchlist_access()
returns trigger language plpgsql security definer set search_path='' as $$
declare cfg public.auryn_access_config%rowtype;pro boolean;cap integer;n integer;
begin
 select * into cfg from public.auryn_access_config where id=true;
 if not coalesce(cfg.enforced,false) or new.user_id=cfg.owner_id then return new;end if;
 if auth.uid() is distinct from new.user_id then raise exception 'Account ownership required' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text||':auryn-watchlist',0));
 select exists(select 1 from public.auryn_beta_grants where user_id=new.user_id and revoked_at is null and expires_at>now()) or exists(select 1 from public.auryn_stripe_subscriptions where user_id=new.user_id and mode=cfg.billing_mode and status in ('active','trialing','past_due') and paid_until>now()) into pro;
 if coalesce(cfg.body->>'mode','private')='private' and not pro then raise exception 'A beta invitation is required' using errcode='42501';end if;
 cap:=coalesce((cfg.body->>(case when pro then 'proWatchlist' else 'freeWatchlist' end))::integer,case when pro then 50 else 5 end);
 if exists(select 1 from public.watchlist_items where user_id=new.user_id and symbol=new.symbol and id<>new.id) then return new;end if;
 select count(distinct symbol) into n from public.watchlist_items where user_id=new.user_id and id<>new.id;
 if n>=cap then raise exception 'Watchlist allowance reached. Remove a saved company before adding another.' using errcode='P0001';end if;
 return new;
end $$;

