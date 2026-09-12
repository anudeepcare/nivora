begin;

create table if not exists public.auryn_model_registry(
  model_version text primary key,
  role text not null check (role in ('CHAMPION','CHALLENGER','RETIRED')),
  enabled boolean not null default true,
  promoted_at timestamptz,
  promoted_by text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.auryn_validation_runs(
  id uuid primary key default gen_random_uuid(),
  run_kind text not null,
  evaluation_date date not null,
  model_version text not null,
  status text not null default 'PENDING' check(status in ('PENDING','RUNNING','PASS','WATCH','FAIL','CANCELLED')),
  expected_symbols integer not null default 0,
  processed_symbols integer not null default 0,
  failed_symbols integer not null default 0,
  report jsonb not null default '{}'::jsonb,
  fingerprint text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(run_kind,evaluation_date,model_version)
);

create table if not exists public.auryn_validation_jobs(
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.auryn_validation_runs(id) on delete cascade,
  idempotency_key text not null unique,
  job_kind text not null,
  batch_no integer not null,
  symbols text[] not null default '{}',
  status text not null default 'PENDING' check(status in ('PENDING','RUNNING','DONE','FAILED')),
  attempt integer not null default 0,
  max_attempts integer not null default 5,
  available_at timestamptz not null default now(),
  leased_at timestamptz,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  error text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists auryn_validation_jobs_ready_idx on public.auryn_validation_jobs(status,available_at);

create table if not exists public.auryn_validation_universe(
  symbol text primary key,
  active boolean not null default true,
  priority integer not null default 100,
  sector text,
  archetype text,
  source text not null default 'AURYN',
  added_at timestamptz not null default now()
);

create table if not exists public.auryn_shadow_snapshots(
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.auryn_validation_runs(id) on delete set null,
  model_version text not null,
  symbol text not null,
  evaluation_date date not null,
  run_kind text not null,
  observed_at timestamptz not null,
  market_price numeric,
  new_money_action text,
  owner_action text,
  long_term_action text,
  decision_score numeric,
  evidence_completeness numeric,
  setup_state text,
  market_state text,
  bear_value numeric,
  base_value numeric,
  bull_value numeric,
  snapshot_fingerprint text not null,
  evidence_fingerprint text,
  canonical_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(model_version, symbol, evaluation_date, run_kind)
);
create index if not exists auryn_shadow_snapshots_symbol_date_idx on public.auryn_shadow_snapshots(symbol,evaluation_date desc);
create index if not exists auryn_shadow_snapshots_model_date_idx on public.auryn_shadow_snapshots(model_version,evaluation_date desc);

create table if not exists public.auryn_shadow_outcomes(
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.auryn_shadow_snapshots(id) on delete cascade,
  horizon text not null check(horizon in ('1W','1M','3M','6M','1Y','3Y','5Y')),
  due_date date not null,
  status text not null default 'PENDING' check(status in ('PENDING','MEASURED','UNAVAILABLE')),
  outcome_price numeric,
  benchmark_return_pct numeric,
  security_return_pct numeric,
  max_drawdown_pct numeric,
  measured_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  unique(snapshot_id,horizon)
);
create index if not exists auryn_shadow_outcomes_due_idx on public.auryn_shadow_outcomes(status,due_date);

create table if not exists public.auryn_model_health(
  id uuid primary key default gen_random_uuid(),
  model_version text not null,
  as_of_date date not null,
  status text not null check(status in ('PASS','WATCH','FAIL','COLLECTING')),
  sample_n integer not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  validation_report jsonb not null default '{}'::jsonb,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique(model_version,as_of_date)
);

create table if not exists public.auryn_provider_rate_buckets(
  bucket_minute timestamptz primary key,
  used_tokens integer not null default 0,
  updated_at timestamptz not null default now()
);


create or replace function public.auryn_lease_validation_job(lease_seconds integer default 120)
returns setof public.auryn_validation_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen uuid;
begin
  select id into chosen
  from public.auryn_validation_jobs
  where status='PENDING' and available_at<=now()
  order by available_at,created_at
  for update skip locked
  limit 1;

  if chosen is null then return; end if;

  update public.auryn_validation_jobs
  set status='RUNNING',
      attempt=attempt+1,
      leased_at=now(),
      lease_expires_at=now()+make_interval(secs=>lease_seconds),
      error=null
  where id=chosen;

  return query select * from public.auryn_validation_jobs where id=chosen;
end $$;

create or replace function public.auryn_acquire_provider_tokens(requested integer, background_limit integer default 42)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket timestamptz := date_trunc('minute', now());
  current_used integer;
begin
  if requested <= 0 or requested > background_limit then return false; end if;
  insert into public.auryn_provider_rate_buckets(bucket_minute,used_tokens)
  values(bucket,0)
  on conflict(bucket_minute) do nothing;

  select used_tokens into current_used
  from public.auryn_provider_rate_buckets
  where bucket_minute=bucket
  for update;

  if current_used + requested > background_limit then return false; end if;

  update public.auryn_provider_rate_buckets
  set used_tokens=used_tokens+requested,updated_at=now()
  where bucket_minute=bucket;
  return true;
end $$;

insert into public.auryn_model_registry(model_version,role,enabled,config)
values('auryn-v9.8','CHAMPION',true,'{"source":"V9.8 Three-Clock Valuation","promotion":"human-approved"}'::jsonb)
on conflict(model_version) do nothing;

-- Seed from the existing market universe when available. The orchestrator tops this up to 300.
do $$
begin
  if to_regclass('public.nivora_market_universe') is not null then
    execute $seed$
      insert into public.auryn_validation_universe(symbol,source)
      select upper(symbol),'nivora_market_universe'
      from public.nivora_market_universe
      where active=true and symbol is not null
      order by symbol
      limit 300
      on conflict(symbol) do nothing
    $seed$;
  end if;
end $$;

commit;
