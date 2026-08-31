create table if not exists public.nivora_rate_limit_buckets (
  bucket_key text primary key,
  window_start timestamptz not null default now(),
  hit_count integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.nivora_rate_limit_buckets enable row level security;

create or replace function public.nivora_take_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.nivora_rate_limit_buckets; now_ts timestamptz:=now(); allowed boolean;
begin
  insert into public.nivora_rate_limit_buckets(bucket_key,window_start,hit_count,updated_at)
  values(p_key,now_ts,1,now_ts)
  on conflict(bucket_key) do update set
    window_start=case when extract(epoch from (now_ts-nivora_rate_limit_buckets.window_start))>=p_window_seconds then now_ts else nivora_rate_limit_buckets.window_start end,
    hit_count=case when extract(epoch from (now_ts-nivora_rate_limit_buckets.window_start))>=p_window_seconds then 1 else nivora_rate_limit_buckets.hit_count+1 end,
    updated_at=now_ts
  returning * into r;
  allowed:=r.hit_count<=p_limit;
  return jsonb_build_object('ok',allowed,'remaining',greatest(0,p_limit-r.hit_count),'reset',extract(epoch from (r.window_start+make_interval(secs=>p_window_seconds)))*1000);
end $$;
revoke all on function public.nivora_take_rate_limit(text,integer,integer) from public;
grant execute on function public.nivora_take_rate_limit(text,integer,integer) to service_role;
