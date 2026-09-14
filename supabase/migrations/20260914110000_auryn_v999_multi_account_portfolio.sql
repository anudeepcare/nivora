-- AURYN V9.9.9 multi-account portfolio. Run once in Supabase SQL Editor.
begin;

alter table public.portfolio_positions
  add column if not exists account_name text;

update public.portfolio_positions
set account_name='Default'
where account_name is null or btrim(account_name)='';

alter table public.portfolio_positions
  alter column account_name set default 'Default',
  alter column account_name set not null;

-- Remove legacy user+symbol uniqueness regardless of its generated constraint name.
do $$
declare r record;
begin
 for r in
  select conname
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public' and t.relname='portfolio_positions' and c.contype='u'
    and pg_get_constraintdef(c.oid) ilike '%(user_id, symbol)%'
 loop
  execute format('alter table public.portfolio_positions drop constraint %I',r.conname);
 end loop;
end $$;

create unique index if not exists portfolio_positions_user_account_symbol_uidx
  on public.portfolio_positions(user_id,account_name,symbol);

create table if not exists public.nivora_portfolio_cash_flows(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 account_name text not null default 'Default',
 amount numeric not null,
 flow_type text not null check(flow_type in ('DEPOSIT','WITHDRAWAL','TRANSFER_IN','TRANSFER_OUT')),
 occurred_at timestamptz not null default now(),
 note text,
 created_at timestamptz not null default now()
);
create index if not exists nivora_portfolio_cash_flows_user_time_idx
 on public.nivora_portfolio_cash_flows(user_id,occurred_at);

alter table public.nivora_portfolio_cash_flows enable row level security;
drop policy if exists "Users manage own portfolio cash flows" on public.nivora_portfolio_cash_flows;
create policy "Users manage own portfolio cash flows" on public.nivora_portfolio_cash_flows
 for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

alter table public.nivora_portfolio_snapshots add column if not exists invested_value numeric;
alter table public.nivora_portfolio_snapshots add column if not exists cash_value numeric;
alter table public.nivora_portfolio_snapshots add column if not exists cost_basis numeric;
alter table public.nivora_portfolio_snapshots add column if not exists unrealized_pnl numeric;

commit;
