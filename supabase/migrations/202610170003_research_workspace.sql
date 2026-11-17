create table if not exists public.auryn_documents (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('note','comparison','view','alert')),
 key text not null check(length(key) between 1 and 80),
 body jsonb not null check(jsonb_typeof(body)='object' and octet_length(body::text)<=20000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(user_id,kind,key)
);
alter table public.auryn_documents enable row level security;
drop policy if exists auryn_documents_own on public.auryn_documents;
create policy auryn_documents_own on public.auryn_documents for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.auryn_documents to authenticated;
create table if not exists public.auryn_observations (
 user_id uuid not null references auth.users(id) on delete cascade,symbol text not null,snapshot_id text not null,
 observed_at timestamptz not null default now(),payload jsonb not null,
 primary key(user_id,symbol,snapshot_id),check(octet_length(payload::text)<=150000)
);
alter table public.auryn_observations enable row level security;
create policy auryn_observations_read on public.auryn_observations for select to authenticated using(user_id=auth.uid());
create policy auryn_observations_save on public.auryn_observations for insert to authenticated with check(user_id=auth.uid());
grant select,insert on public.auryn_observations to authenticated;
create table if not exists public.auryn_alert_events (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 rule_key text not null,event_key text not null,symbol text not null,title text not null,detail text not null,
 snapshot_id text not null,created_at timestamptz not null default now(),read_at timestamptz,
 unique(user_id,rule_key,event_key)
);
alter table public.auryn_alert_events enable row level security;
create policy auryn_alert_events_own on public.auryn_alert_events for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.auryn_alert_events to authenticated;
create index if not exists auryn_alert_events_recent on public.auryn_alert_events(user_id,created_at desc);
create index if not exists auryn_observations_recent on public.auryn_observations(user_id,symbol,observed_at desc);
-- Service-role jobs still provide an explicit tenant ID for every private read and write.
grant all on public.auryn_documents,public.auryn_observations,public.auryn_alert_events to service_role;
