alter table public.nivora_scan_state add column if not exists scan_running boolean not null default false;
alter table public.nivora_scan_state add column if not exists scan_started_at timestamptz;
alter table public.nivora_scan_state add column if not exists scanned_count integer not null default 0;
alter table public.nivora_scan_state add column if not exists fresh_count integer not null default 0;
alter table public.nivora_scan_state add column if not exists first_full_scan_at timestamptz;
alter table public.nivora_scan_state add column if not exists last_complete_scan_at timestamptz;
create index if not exists nivora_market_scan_fresh_rank_idx on public.nivora_market_scan(scanned_at desc, rank_score desc);
