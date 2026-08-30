create table if not exists public.nivora_market_universe (
  symbol text primary key,
  name text,
  exchange text,
  instrument_type text,
  currency text,
  country text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.nivora_market_scan (
  symbol text primary key references public.nivora_market_universe(symbol) on delete cascade,
  price numeric,
  change_pct numeric,
  score integer,
  rank_score integer,
  confidence integer,
  technical integer,
  entry_score integer,
  risk_score integer,
  trend integer,
  momentum integer,
  flow integer,
  extension integer,
  action text,
  category text,
  reason text,
  entry_low numeric,
  entry_high numeric,
  target_1 numeric,
  target_2 numeric,
  thesis_break numeric,
  reward_risk numeric,
  geometry_valid boolean not null default false,
  geometry_reason text,
  source text not null default 'Twelve Data daily technical pre-screen',
  scanned_at timestamptz not null default now()
);

create table if not exists public.nivora_scan_state (
  id integer primary key default 1 check (id=1),
  cursor integer not null default 0,
  universe_count integer not null default 0,
  last_universe_sync timestamptz,
  last_scan_at timestamptz,
  last_batch_size integer not null default 0,
  last_error text
);
insert into public.nivora_scan_state(id) values(1) on conflict(id) do nothing;

create index if not exists nivora_market_scan_rank_idx on public.nivora_market_scan(rank_score desc, scanned_at desc);
create index if not exists nivora_market_scan_action_idx on public.nivora_market_scan(action, rank_score desc);
create index if not exists nivora_market_scan_category_idx on public.nivora_market_scan(category, rank_score desc);
create index if not exists nivora_market_scan_time_idx on public.nivora_market_scan(scanned_at desc);

alter table public.nivora_market_universe enable row level security;
alter table public.nivora_market_scan enable row level security;
alter table public.nivora_scan_state enable row level security;
-- No browser policies. The scanner and Discover API use the server-side service role.
