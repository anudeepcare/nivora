-- Immutable model outputs and human-review records. Values are never silently overwritten.
create table if not exists public.auryn_valuation_outputs(
  trace_id text primary key check(length(trace_id) between 12 and 160),
  symbol text not null,
  as_of date not null,
  model_version text not null,
  config_hash text not null,
  status text not null check(status in ('ok','low-confidence','range-only','refused')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  review_status text not null default 'unreviewed' check(review_status in ('unreviewed','approved','rejected','superseded')),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create index if not exists auryn_valuation_outputs_symbol_date on public.auryn_valuation_outputs(symbol,as_of desc);
alter table public.auryn_valuation_outputs enable row level security;
revoke all on public.auryn_valuation_outputs from anon,authenticated;
grant select,insert on public.auryn_valuation_outputs to service_role;
grant select on public.auryn_valuation_outputs to authenticated;
drop policy if exists auryn_valuation_outputs_authenticated_read on public.auryn_valuation_outputs;
create policy auryn_valuation_outputs_authenticated_read on public.auryn_valuation_outputs for select to authenticated using (review_status = 'approved' and as_of <= current_date);

create table if not exists public.auryn_valuation_overrides(
  id bigint generated always as identity primary key,
  trace_id text not null references public.auryn_valuation_outputs(trace_id),
  symbol text not null,
  proposed_by uuid not null,
  approved_by uuid,
  proposer_role text not null default 'analyst' check(proposer_role in ('analyst','portfolio_manager','compliance')),
  approver_role text check(approver_role in ('portfolio_manager','compliance')),
  reason text not null check(length(reason) between 10 and 2000),
  patch jsonb not null,
  status text not null default 'proposed' check(status in ('proposed','approved','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check(status = 'proposed' or (approved_by is not null and approver_role is not null and approved_by <> proposed_by))
);
create index if not exists auryn_valuation_overrides_trace on public.auryn_valuation_overrides(trace_id,created_at desc);
alter table public.auryn_valuation_overrides enable row level security;
revoke all on public.auryn_valuation_overrides from anon,authenticated;
grant select,insert,update on public.auryn_valuation_overrides to service_role;

create or replace function public.auryn_block_valuation_override_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Valuation overrides are append-only; record a new decision';
end;
$$;
drop trigger if exists auryn_valuation_overrides_immutable on public.auryn_valuation_overrides;
create trigger auryn_valuation_overrides_immutable before update or delete on public.auryn_valuation_overrides
for each row execute function public.auryn_block_valuation_override_mutation();

-- Review decisions are append-only events; an output row is never rewritten to change history.
create table if not exists public.auryn_valuation_reviews(
  id bigint generated always as identity primary key,
  trace_id text not null references public.auryn_valuation_outputs(trace_id),
  reviewer_id uuid not null,
  reviewer_role text not null check(reviewer_role in ('portfolio_manager','compliance')),
  decision text not null check(decision in ('approved','rejected')),
  reason text not null check(length(reason) between 10 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists auryn_valuation_reviews_trace on public.auryn_valuation_reviews(trace_id,created_at desc);
alter table public.auryn_valuation_reviews enable row level security;
revoke all on public.auryn_valuation_reviews from anon,authenticated;
grant select,insert on public.auryn_valuation_reviews to service_role;
drop trigger if exists auryn_valuation_reviews_immutable on public.auryn_valuation_reviews;
create trigger auryn_valuation_reviews_immutable before update or delete on public.auryn_valuation_reviews
for each row execute function public.auryn_block_valuation_override_mutation();

-- Publication is derived from the latest immutable review event. This lets an approval
-- publish an immutable output and a later rejection withdraw it without rewriting history.
create or replace function public.auryn_valuation_is_published(p_trace_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.auryn_valuation_reviews latest
    where latest.trace_id = p_trace_id
      and latest.decision = 'approved'
      and not exists (
        select 1 from public.auryn_valuation_reviews newer
        where newer.trace_id = latest.trace_id and newer.created_at > latest.created_at
      )
  );
$$;
revoke all on function public.auryn_valuation_is_published(text) from public;
grant execute on function public.auryn_valuation_is_published(text) to authenticated, service_role;
drop policy if exists auryn_valuation_outputs_authenticated_read on public.auryn_valuation_outputs;
create policy auryn_valuation_outputs_authenticated_read on public.auryn_valuation_outputs for select to authenticated using (as_of <= current_date and public.auryn_valuation_is_published(trace_id));

create or replace function public.auryn_block_valuation_output_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Valuation outputs are immutable; append a new trace instead';
end;
$$;
drop trigger if exists auryn_valuation_outputs_immutable on public.auryn_valuation_outputs;
create trigger auryn_valuation_outputs_immutable before update or delete on public.auryn_valuation_outputs
for each row execute function public.auryn_block_valuation_output_mutation();

