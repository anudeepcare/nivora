create table if not exists public.auryn_fact_observations(
 id bigint generated always as identity primary key,
 symbol text not null check(length(symbol) between 1 and 32),
 metric text not null check(length(metric) between 1 and 80),
 period_end date not null,
 period_type text not null check(period_type in ('Q','FY','TTM','instant')),
 value numeric not null,
 unit text not null,
 currency text,
 source text not null,
 source_ref text,
 filed_at timestamptz not null,
 ingested_at timestamptz not null default now(),
 restates_id bigint references public.auryn_fact_observations(id),
 status text not null default 'clean' check(status in ('clean','disputed','blocked'))
);
create index if not exists auryn_fact_observations_lookup on public.auryn_fact_observations(symbol,metric,period_end,filed_at);
alter table public.auryn_fact_observations enable row level security;
revoke all on public.auryn_fact_observations from anon,authenticated;
grant select,insert on public.auryn_fact_observations to service_role;

create or replace function public.auryn_block_fact_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Valuation observations are append-only';
end;
$$;
drop trigger if exists auryn_fact_observations_immutable on public.auryn_fact_observations;
create trigger auryn_fact_observations_immutable before update or delete on public.auryn_fact_observations
for each row execute function public.auryn_block_fact_mutation();

create table if not exists public.auryn_corporate_actions(
 id bigint generated always as identity primary key,
 symbol text not null,
 action_type text not null check(action_type in ('split','reverse_split','spin_off','merger','ticker_change','delisting')),
 effective_date date not null,
 ratio numeric,
 source text not null,
 source_ref text,
 filed_at timestamptz not null,
 ingested_at timestamptz not null default now()
);
create index if not exists auryn_corporate_actions_lookup on public.auryn_corporate_actions(symbol,effective_date,filed_at);
alter table public.auryn_corporate_actions enable row level security;
revoke all on public.auryn_corporate_actions from anon,authenticated;
grant select,insert on public.auryn_corporate_actions to service_role;
drop trigger if exists auryn_corporate_actions_immutable on public.auryn_corporate_actions;
create trigger auryn_corporate_actions_immutable before update or delete on public.auryn_corporate_actions
for each row execute function public.auryn_block_fact_mutation();

