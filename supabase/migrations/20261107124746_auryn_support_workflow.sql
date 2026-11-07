-- Owner-only workflow metadata. Existing server-only privileges remain unchanged.
alter table public.auryn_support_requests add column if not exists priority text not null default 'normal' check(priority in ('normal','high','urgent'));
alter table public.auryn_support_requests add column if not exists assignee text not null default '' check(length(assignee)<=120);
alter table public.auryn_support_requests add column if not exists search_document tsvector generated always as (to_tsvector('simple'::regconfig,coalesce(email,'') || ' ' || coalesce(category,'') || ' ' || coalesce(message,''))) stored;
create index if not exists auryn_support_search_idx on public.auryn_support_requests using gin(search_document);
create index if not exists auryn_support_workflow_page_idx on public.auryn_support_requests(status,priority,created_at desc,id desc);
