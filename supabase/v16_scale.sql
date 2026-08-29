-- NIVORA V16 scale foundation. Safe to run after earlier migrations.
create table if not exists public.symbol_activity (
  symbol text primary key,
  last_seen_at timestamptz not null default now(),
  view_count bigint not null default 0
);
alter table public.symbol_activity enable row level security;
-- No browser policies: reserved for future server-side popularity/warming logic.
create index if not exists idx_symbol_activity_last_seen on public.symbol_activity(last_seen_at desc);
create index if not exists idx_watchlist_items_symbol on public.watchlist_items(symbol);
DO $$ BEGIN
  IF to_regclass('public.portfolio_positions') IS NOT NULL THEN
    EXECUTE 'create index if not exists idx_portfolio_positions_symbol on public.portfolio_positions(symbol)';
  END IF;
END $$;
