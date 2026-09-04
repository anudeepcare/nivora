create table if not exists public.nivora_v65_trading_runs (
  id uuid primary key default gen_random_uuid(),
  engine_version text not null,
  trading_lab_version text not null,
  automatic boolean not null default true,
  session text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'RUNNING',
  processed integer not null default 0,
  submitted integer not null default 0,
  blocked integer not null default 0,
  errors integer not null default 0,
  results jsonb not null default '[]'::jsonb,
  error text
);
create index if not exists idx_nivora_v65_trading_runs_started on public.nivora_v65_trading_runs(started_at desc);
alter table public.nivora_v65_trading_runs enable row level security;
