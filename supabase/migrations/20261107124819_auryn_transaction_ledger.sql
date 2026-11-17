-- User-owned activity; optimistic revision checks in the server prevent lost updates.
create table if not exists public.auryn_transaction_ledgers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 rows jsonb not null default '[]'::jsonb check(jsonb_typeof(rows)='array' and jsonb_array_length(rows)<=5000 and octet_length(rows::text)<=2000000),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.auryn_transaction_ledgers enable row level security;
revoke all on public.auryn_transaction_ledgers from anon;
grant select,insert,update,delete on public.auryn_transaction_ledgers to authenticated;
grant all on public.auryn_transaction_ledgers to service_role;
create policy auryn_transaction_ledgers_own on public.auryn_transaction_ledgers for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
