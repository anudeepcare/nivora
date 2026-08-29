create table if not exists public.nivora_institutional_snapshots(
  symbol text not null,
  period_end date not null,
  issuer_name text,
  source text not null default 'SEC Form 13F',
  match_confidence text not null default 'normalized issuer-name exact',
  reporting_managers integer not null default 0,
  increased_managers integer not null default 0,
  reduced_managers integer not null default 0,
  unchanged_managers integer not null default 0,
  new_managers integer not null default 0,
  exited_managers integer not null default 0,
  total_shares numeric,
  prior_total_shares numeric,
  net_share_change numeric,
  total_value numeric,
  prior_total_value numeric,
  top_holders jsonb not null default '[]'::jsonb,
  source_url text,
  synced_at timestamptz not null default now(),
  primary key(symbol,period_end)
);

create index if not exists nivora_institutional_symbol_period_idx
  on public.nivora_institutional_snapshots(symbol,period_end desc);

alter table public.nivora_institutional_snapshots enable row level security;

-- No public RLS policy is created. NIVORA reads/writes this cache server-side
-- with SUPABASE_SERVICE_ROLE_KEY only.
