-- Paper-only deployment safety. Review/apply explicitly; new controls start paused.
-- Core trading tables are created by existing trading-lab migrations.
create table if not exists public.auryn_paper_control (
 singleton boolean primary key default true check (singleton),
 paused boolean not null default true,
 lease_owner uuid,
 lease_until timestamptz,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table public.auryn_paper_control enable row level security;
revoke all on public.auryn_paper_control from anon, authenticated;
grant select, insert, update on public.auryn_paper_control to service_role;
insert into public.auryn_paper_control(singleton,paused) values(true,true) on conflict(singleton) do nothing;

create or replace function public.auryn_paper_lease(p_owner uuid, p_operation text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_owner is null then return false; end if;
 if p_operation='observe' then
  update public.auryn_paper_control set lease_owner=p_owner,lease_until=clock_timestamp()+interval '120 seconds'
  where singleton and (lease_until is null or lease_until<clock_timestamp() or lease_owner=p_owner);
 elsif p_operation='acquire' then
  update public.auryn_paper_control set lease_owner=p_owner,lease_until=clock_timestamp()+interval '120 seconds'
  where singleton and not paused and (lease_until is null or lease_until<clock_timestamp() or lease_owner=p_owner);
 elsif p_operation='renew' then
  update public.auryn_paper_control set lease_until=clock_timestamp()+interval '120 seconds'
  where singleton and not paused and lease_owner=p_owner and lease_until>clock_timestamp();
 elsif p_operation='release' then
  update public.auryn_paper_control set lease_owner=null,lease_until=null where singleton and lease_owner=p_owner;
 else
  return false;
 end if;
 return found;
end;
$$;
revoke all on function public.auryn_paper_lease(uuid,text) from public, anon, authenticated;
grant execute on function public.auryn_paper_lease(uuid,text) to service_role;

alter table public.nivora_v61_trade_intents
 add column if not exists run_id uuid references public.nivora_v65_trading_runs(id),
 add column if not exists client_order_id text,
 add column if not exists order_plan jsonb;
alter table public.nivora_v61_trade_evaluations add column if not exists run_id uuid references public.nivora_v65_trading_runs(id);
create index if not exists nivora_paper_evaluation_run on public.nivora_v61_trade_evaluations(run_id);
alter table public.nivora_v61_paper_orders
 add column if not exists filled_quantity numeric,
 add column if not exists filled_avg_price numeric,
 add column if not exists broker_checked_at timestamptz;
-- Explicit service access; these tables remain isolated from browser roles by RLS.
grant select,insert,update on public.nivora_v61_trade_intents,public.nivora_v61_trade_evaluations,public.nivora_v61_paper_orders,public.nivora_v61_trade_fills,public.nivora_v65_trading_runs,public.nivora_provider_health to service_role;
grant usage,select on all sequences in schema public to service_role;

-- Apply after the existing schema. API writes use service role; browser cannot submit directly.
create table if not exists public.auryn_manual_paper_orders (
 id uuid primary key,
 user_id uuid not null references auth.users(id),
 symbol text not null,
 side text not null check (side in ('BUY','SELL')),
 quantity integer not null check (quantity > 0 and quantity <= 10000),
 limit_price numeric not null check (limit_price > 0),
 status text not null,
 broker_order_id text,
 detail text,
 created_at timestamptz not null default now()
);
alter table public.auryn_manual_paper_orders enable row level security;
drop policy if exists "Read own manual paper audit" on public.auryn_manual_paper_orders;
create policy "Read own manual paper audit" on public.auryn_manual_paper_orders for select to authenticated using (auth.uid() = user_id);
grant select on public.auryn_manual_paper_orders to authenticated;
revoke insert, update, delete on public.auryn_manual_paper_orders from anon, authenticated;

-- Re-run this file when upgrading an existing manual-paper deployment.
-- Nullable fields distinguish unverified submissions from verified zero fills.
alter table public.auryn_manual_paper_orders
 add column if not exists filled_quantity numeric check (filled_quantity >= 0 and filled_quantity <= quantity),
 add column if not exists filled_avg_price numeric check (filled_avg_price > 0),
 add column if not exists broker_checked_at timestamptz,
 add column if not exists cancel_requested_at timestamptz,
 add column if not exists cancel_status text check (cancel_status in ('REQUESTING','REQUESTED','UNKNOWN'));
create index if not exists auryn_manual_paper_orders_owner_created_idx on public.auryn_manual_paper_orders (user_id, created_at desc);
grant select, insert, update on public.auryn_manual_paper_orders to service_role;
