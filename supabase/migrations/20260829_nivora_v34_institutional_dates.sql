alter table public.nivora_institutional_snapshots
  add column if not exists previous_period_end date,
  add column if not exists dataset_through date;

create index if not exists nivora_institutional_synced_idx
  on public.nivora_institutional_snapshots(symbol, synced_at desc);
