begin;
-- Public market observations only. Account IDs, holdings and thesis text never enter this table.
create table public.auryn_public_pace_records (
 id bigint generated always as identity primary key,
 published_at timestamptz not null default clock_timestamp(),
 symbol text not null check(symbol ~ '^[A-Z][A-Z0-9.-]{0,14}$'),
 signal_period text not null check(signal_period ~ '^20[0-9]{2}-[0-9]{2}$'),
 policy text not null check(policy='monthly-v5'),
 pace integer not null check(pace between 0 and 4),
 reference_price numeric not null check(reference_price>0),
 quote_at timestamptz not null,
 evidence_hash text not null check(evidence_hash ~ '^[a-f0-9]{64}$'),
 policy_hash text not null check(policy_hash ~ '^[a-f0-9]{64}$'),
 unique(symbol,signal_period,policy)
);
alter table public.auryn_public_pace_records enable row level security;
revoke all on public.auryn_public_pace_records from public,anon,authenticated,service_role;
grant select on public.auryn_public_pace_records to anon,authenticated,service_role;
grant insert(symbol,signal_period,policy,pace,reference_price,quote_at,evidence_hash,policy_hash) on public.auryn_public_pace_records to service_role;
grant usage,select on sequence public.auryn_public_pace_records_id_seq to service_role;
create policy public_pace_read on public.auryn_public_pace_records for select to anon,authenticated using(true);
-- No UPDATE/DELETE grants or policies. Client cannot supply publication timestamp.
commit;
