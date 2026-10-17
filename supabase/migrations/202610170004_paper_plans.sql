-- Server-controlled paper plans. No broker secret or order authority is exposed to clients.
create table if not exists public.auryn_paper_plans(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 body jsonb not null check(octet_length(body::text)<10000),enabled boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.auryn_paper_runs(
 id uuid primary key default gen_random_uuid(),plan_id uuid not null references public.auryn_paper_plans(id),user_id uuid not null references auth.users(id),
 period_key text not null,client_order_id text unique not null,status text not null default 'reserved',
 detail text not null default '',broker_order_id text,filled_qty numeric,filled_avg_price numeric,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(plan_id,period_key));
create table if not exists public.auryn_paper_lock(singleton boolean primary key default true check(singleton),run_id uuid not null references public.auryn_paper_runs(id));
alter table public.auryn_paper_plans enable row level security;
alter table public.auryn_paper_runs enable row level security;
alter table public.auryn_paper_lock enable row level security;
create policy paper_plans_read on public.auryn_paper_plans for select to authenticated using((select auth.uid())=user_id);
create policy paper_runs_read on public.auryn_paper_runs for select to authenticated using((select auth.uid())=user_id);
grant select on public.auryn_paper_plans,public.auryn_paper_runs to authenticated;
grant all on public.auryn_paper_plans,public.auryn_paper_runs,public.auryn_paper_lock to service_role;
create or replace function public.auryn_claim_paper(p_plan uuid,p_user uuid,p_period text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.auryn_paper_runs; rid uuid:=gen_random_uuid();begin
 perform pg_advisory_xact_lock(799102431);
 if exists(select 1 from auryn_paper_lock) then raise exception 'An unresolved paper run must be reconciled first';end if;
 if not exists(select 1 from auryn_paper_plans where id=p_plan and user_id=p_user and enabled=true for update) then raise exception 'Plan is paused or unavailable';end if;
 insert into auryn_paper_runs(id,plan_id,user_id,period_key,client_order_id) values(rid,p_plan,p_user,p_period,'auryn-'||rid::text) returning * into r;
 insert into auryn_paper_lock(singleton,run_id) values(true,rid);
 return to_jsonb(r);end $$;
revoke all on function public.auryn_claim_paper(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.auryn_claim_paper(uuid,uuid,text) to service_role;
create index if not exists auryn_paper_runs_owner_date on public.auryn_paper_runs(user_id,created_at desc);
