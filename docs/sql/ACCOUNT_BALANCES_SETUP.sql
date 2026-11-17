-- Run once in Supabase SQL Editor for the nivora project.
-- Balances are account-owned; no stock quantities or cost bases are changed.
begin;
create table if not exists public.auryn_account_balances (
 user_id uuid primary key references auth.users(id) on delete cascade,
 margin_debt numeric(16,2) not null default 0 check (margin_debt >= 0 and margin_debt <= 1000000000000),
 managed_value numeric(16,2) check (managed_value >= 0 and managed_value <= 1000000000000),
 updated_at timestamptz not null default now()
);
alter table public.auryn_account_balances enable row level security;
revoke all on public.auryn_account_balances from anon;
grant select,insert,update,delete on public.auryn_account_balances to authenticated;
drop policy if exists auryn_account_balances_own on public.auryn_account_balances;
create policy auryn_account_balances_own on public.auryn_account_balances
 for all to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
-- Only Anudeep's account. Unknown managed value stays NULL; never assume $120,000.
insert into public.auryn_account_balances(user_id,margin_debt,managed_value)
select id,116312.00,null from auth.users where lower(email)='anudeep39@gmail.com'
on conflict(user_id) do update set margin_debt=excluded.margin_debt,updated_at=now();
commit;
-- Confirm exactly one account row, with debt 116312.00.
select b.margin_debt,b.managed_value,b.updated_at from public.auryn_account_balances b
join auth.users u on u.id=b.user_id where lower(u.email)='anudeep39@gmail.com';
-- Enter the exact managed value in Portfolio > Edit margin & managed balance.
-- Include ONLY investments not already itemized in the holdings list.
