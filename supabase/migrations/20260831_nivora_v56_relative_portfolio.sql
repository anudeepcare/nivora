alter table if exists public.nivora_investment_scan add column if not exists sector text;
alter table if exists public.nivora_investment_scan add column if not exists archetype text;
alter table if exists public.nivora_investment_scan add column if not exists universe_percentile numeric;
alter table if exists public.nivora_investment_scan add column if not exists peer_percentile numeric;
alter table if exists public.nivora_investment_scan add column if not exists engine_version text default 'v56';
create index if not exists idx_nivora_scan_sector_score on public.nivora_investment_scan(sector, thesis_score desc);
create index if not exists idx_nivora_scan_archetype_score on public.nivora_investment_scan(archetype, thesis_score desc);
