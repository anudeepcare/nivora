create table if not exists public.nivora_investment_scan (
  symbol text primary key,
  company_name text,
  market_cap_m numeric,
  company_score int,
  growth_score int,
  financial_score int,
  analyst_score int,
  valuation_score int,
  thesis_score int,
  opportunity_score int,
  thesis_label text,
  thesis_state text,
  action text,
  reason text,
  main_risk text,
  target_mean numeric,
  target_upside_pct numeric,
  price numeric,
  change_pct numeric,
  evidence_confidence int,
  scanned_at timestamptz not null default now(),
  previous_thesis_score int,
  previous_action text,
  changed_at timestamptz
);
create index if not exists nivora_investment_opportunity_idx on public.nivora_investment_scan(opportunity_score desc);
create index if not exists nivora_investment_thesis_idx on public.nivora_investment_scan(thesis_score desc);
create index if not exists nivora_investment_changed_idx on public.nivora_investment_scan(changed_at desc);

alter table public.nivora_scan_state add column if not exists investment_scanned_count int default 0;
alter table public.nivora_scan_state add column if not exists investment_fresh_count int default 0;
alter table public.nivora_scan_state add column if not exists last_investment_scan_at timestamptz;
