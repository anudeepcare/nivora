alter table public.nivora_market_scan add column if not exists previous_action text;
alter table public.nivora_market_scan add column if not exists previous_rank_score integer;
alter table public.nivora_market_scan add column if not exists changed_at timestamptz;
create index if not exists nivora_market_scan_changed_idx on public.nivora_market_scan(changed_at desc, rank_score desc);
