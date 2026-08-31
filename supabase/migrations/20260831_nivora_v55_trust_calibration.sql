-- V55 Trust & Calibration Foundation. Run before collecting V55 observations.
alter table public.nivora_decision_history add column if not exists engine_version text not null default 'legacy';
alter table public.nivora_decision_history add column if not exists weights_version text not null default 'legacy';
alter table public.nivora_decision_history add column if not exists valuation_version text not null default 'legacy';
alter table public.nivora_decision_history add column if not exists archetype text;
alter table public.nivora_decision_history add column if not exists benchmark_symbol text;

alter table public.nivora_decision_outcomes add column if not exists benchmark_symbol text;
alter table public.nivora_decision_outcomes add column if not exists benchmark_return_pct numeric;
alter table public.nivora_decision_outcomes add column if not exists excess_return_pct numeric;
alter table public.nivora_decision_outcomes add column if not exists max_drawdown_pct numeric;
alter table public.nivora_decision_outcomes add column if not exists max_favorable_excursion_pct numeric;

create index if not exists nivora_history_engine_idx on public.nivora_decision_history(engine_version, weights_version, observed_at desc);
create index if not exists nivora_history_archetype_idx on public.nivora_decision_history(archetype, thesis_score, observed_at desc);
