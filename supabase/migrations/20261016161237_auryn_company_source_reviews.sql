-- Server-owned source reviews. The API authenticates a trusted administrator,
-- re-reads SEC evidence and validates citations before inserting. No client grant.
create table if not exists public.auryn_company_source_reviews (
 id uuid primary key default gen_random_uuid(),
 symbol text not null check (symbol ~ '^[A-Z0-9][A-Z0-9.-]{0,14}$'),
 cik text not null check (cik ~ '^[0-9]{1,10}$'),
 evidence_revision text not null check (evidence_revision ~ '^[a-f0-9]{64}$'),
 reviewed_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 payload jsonb not null check (
  jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 131072
  and payload @> '{"citationsReviewed":true}'
  and payload ?& array['evidenceRevision','readEvidenceIds','reviewNotes','valuationReview','businessEvidence']
  and payload->>'evidenceRevision' = evidence_revision
  and jsonb_typeof(payload->'readEvidenceIds') = 'array'
  and jsonb_typeof(payload->'businessEvidence') = 'array'
 )
);
alter table public.auryn_company_source_reviews enable row level security;
revoke all on public.auryn_company_source_reviews from public, anon, authenticated, service_role;
grant select, insert on public.auryn_company_source_reviews to service_role;
create index if not exists auryn_company_source_reviews_latest on public.auryn_company_source_reviews(symbol,cik,created_at desc);
create index if not exists auryn_company_source_reviews_author on public.auryn_company_source_reviews(reviewed_by);
comment on table public.auryn_company_source_reviews is 'Append-only administrator source review audit. SEC citation metadata only; no client canonical research or order authority.';
