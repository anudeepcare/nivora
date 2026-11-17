-- Permanent public membership defaults. Retains account data, grants and subscriptions.
update public.auryn_access_config set body=body||'{"mode":"beta","freeResearch":100,"proResearch":-1}'::jsonb,updated_at=now() where id=true;
-- Invitations grant complimentary Pro; they never gate Free watchlist access.
create or replace function auryn_private.guard_watchlist_access()
returns trigger language plpgsql security definer set search_path='' as $$
declare cfg public.auryn_access_config%rowtype;pro boolean;cap integer;n integer;
begin
 select * into cfg from public.auryn_access_config where id=true;
 if not coalesce(cfg.enforced,false) or new.user_id=cfg.owner_id then return new;end if;
 if auth.uid() is distinct from new.user_id then raise exception 'Account ownership required' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text||':auryn-watchlist',0));
 select exists(select 1 from public.auryn_beta_grants where user_id=new.user_id and revoked_at is null and expires_at>now()) or exists(select 1 from public.auryn_stripe_subscriptions where user_id=new.user_id and mode=cfg.billing_mode and status in ('active','trialing','past_due') and paid_until>now()) into pro;
 cap:=coalesce((cfg.body->>(case when pro then 'proWatchlist' else 'freeWatchlist' end))::integer,case when pro then 50 else 5 end);
 if exists(select 1 from public.watchlist_items where user_id=new.user_id and symbol=new.symbol and id<>new.id) then return new;end if;
 select count(distinct symbol) into n from public.watchlist_items where user_id=new.user_id and id<>new.id;
 if n>=cap then raise exception 'Watchlist allowance reached. Remove a saved company before adding another.' using errcode='P0001';end if;
 return new;
end $$;
