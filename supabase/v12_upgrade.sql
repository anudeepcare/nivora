create table if not exists public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  shares numeric not null check (shares > 0),
  avg_cost numeric not null check (avg_cost >= 0),
  horizon text not null default 'long' check (horizon in ('short','swing','long')),
  thesis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,symbol)
);
alter table public.portfolio_positions enable row level security;
drop policy if exists portfolio_positions_own on public.portfolio_positions;
create policy portfolio_positions_own on public.portfolio_positions for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create index if not exists idx_portfolio_positions_user on public.portfolio_positions(user_id);
create index if not exists idx_watchlist_items_user_symbol on public.watchlist_items(user_id,symbol);
create index if not exists idx_alerts_user_symbol on public.alerts(user_id,symbol,is_active);
