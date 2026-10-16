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
