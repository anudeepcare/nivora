-- Fresh installation baseline. Existing account records are not replaced.
create table if not exists public.portfolio_positions(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 symbol text not null,shares numeric not null check(shares>0),avg_cost numeric not null check(avg_cost>=0),
 horizon text not null default 'long' check(horizon in ('short','swing','long')),thesis text,
 asset_type text not null default 'EQUITY' check(asset_type in ('EQUITY','CRYPTO','CASH')),currency text,account_name text not null default 'Default',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.watchlists(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null default 'My Watchlist',created_at timestamptz not null default now());
create table if not exists public.watchlist_items(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,watchlist_id uuid not null references public.watchlists(id) on delete cascade,symbol text not null,created_at timestamptz not null default now(),unique(watchlist_id,symbol));
alter table public.portfolio_positions enable row level security;alter table public.watchlists enable row level security;alter table public.watchlist_items enable row level security;
drop policy if exists auryn_positions_own on public.portfolio_positions;create policy auryn_positions_own on public.portfolio_positions for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists auryn_watchlists_own on public.watchlists;create policy auryn_watchlists_own on public.watchlists for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists auryn_watchlist_items_own on public.watchlist_items;create policy auryn_watchlist_items_own on public.watchlist_items for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
grant select,insert,update,delete on public.portfolio_positions,public.watchlists,public.watchlist_items to authenticated;
create index if not exists auryn_positions_owner on public.portfolio_positions(user_id);
