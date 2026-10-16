-- User-owned research. Original decisions and reviews are append-only, including
-- through direct authenticated Data API access. No live migration is run here.
create table if not exists public.auryn_research_workspace (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('watch','view','preferences','snapshot','alert','decision-journal','decision-review','allocation-plan')),
  key text not null check (char_length(key) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 131072),
  updated_at timestamptz not null default now(),
  parent_kind text generated always as (case when kind='decision-review' then 'decision-journal' end) stored,
  parent_key text generated always as (case when kind='decision-review' then payload->>'decisionId' end) stored,
  primary key (user_id, kind, key),
  constraint research_review_original foreign key (user_id,parent_kind,parent_key) references public.auryn_research_workspace(user_id,kind,key) on delete cascade,
  constraint research_record_identity check (kind not in ('decision-journal','decision-review') or (payload ? 'id' and payload->>'id'=key)),
  constraint research_original_kind check (kind <> 'decision-journal' or (payload @> '{"kind":"DECISION","immutable":true}')),
  constraint research_review_kind check (kind <> 'decision-review' or (payload @> '{"kind":"REVIEW"}' and coalesce(char_length(payload->>'decisionId'),0)>0))
);
alter table public.auryn_research_workspace enable row level security;
revoke all on public.auryn_research_workspace from anon;
grant select, insert, update, delete on public.auryn_research_workspace to authenticated;
drop policy if exists research_workspace_select on public.auryn_research_workspace;
create policy research_workspace_select on public.auryn_research_workspace for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists research_workspace_insert on public.auryn_research_workspace;
create policy research_workspace_insert on public.auryn_research_workspace for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists research_workspace_update on public.auryn_research_workspace;
create policy research_workspace_update on public.auryn_research_workspace for update to authenticated using ((select auth.uid()) = user_id and kind not in ('decision-journal','decision-review')) with check ((select auth.uid()) = user_id and kind not in ('decision-journal','decision-review'));
drop policy if exists research_workspace_delete on public.auryn_research_workspace;
create policy research_workspace_delete on public.auryn_research_workspace for delete to authenticated using ((select auth.uid()) = user_id and kind not in ('decision-journal','decision-review'));
create index if not exists research_workspace_user_updated on public.auryn_research_workspace(user_id, updated_at desc);
create index if not exists research_workspace_review_parent on public.auryn_research_workspace(user_id,parent_kind,parent_key) where parent_key is not null;
comment on table public.auryn_research_workspace is 'User-owned watch context, saved views, canonical evidence, alert history and immutable decision journals. No trade authority.';
