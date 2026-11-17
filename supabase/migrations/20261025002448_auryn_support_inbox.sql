-- Server-only support records. No direct public or authenticated Data API access.
create table if not exists public.auryn_support_requests (
 id uuid primary key,
 email text not null,
 category text not null check(category in ('General enquiry','Technical issue','Billing','Feedback','Privacy concern')),
 message text not null check(length(message) between 10 and 5000),
 page text not null default '/contact',
 status text not null default 'new' check(status in ('new','in_progress','resolved')),
 request_hash text not null,
 sender_hash text not null,
 created_at timestamptz not null default now(),
 owner_notified_at timestamptz,
 receipt_sent_at timestamptz,
 attempts integer not null default 0
);
alter table public.auryn_support_requests enable row level security;
revoke all on public.auryn_support_requests from public,anon,authenticated;
grant select,insert,update on public.auryn_support_requests to service_role;
create index if not exists auryn_support_created_idx on public.auryn_support_requests(created_at desc);
create index if not exists auryn_support_sender_idx on public.auryn_support_requests(sender_hash,created_at desc);
create or replace function public.auryn_submit_support(p_body jsonb,p_sender text,p_hash text) returns uuid
language plpgsql security invoker set search_path=public,pg_temp as $$
declare existing_hash text; result uuid;
begin
 perform pg_advisory_xact_lock(hashtext('auryn-support-submit'));
 select request_hash into existing_hash from auryn_support_requests where id=(p_body->>'id')::uuid;
 if found then
  if existing_hash <> p_hash then raise exception 'Request identity mismatch'; end if;
  return (p_body->>'id')::uuid;
 end if;
 if (select count(*) from auryn_support_requests where sender_hash=p_sender and created_at>now()-interval '1 hour')>=3
 or (select count(*) from auryn_support_requests where created_at>now()-interval '1 day')>=200 then
  raise exception 'Support request limit reached';
 end if;
 insert into auryn_support_requests(id,email,category,message,page,sender_hash,request_hash)
 values((p_body->>'id')::uuid,p_body->>'email',p_body->>'category',p_body->>'message',p_body->>'page',p_sender,p_hash) returning id into result;
 return result;
end;$$;
revoke all on function public.auryn_submit_support(jsonb,text,text) from public,anon,authenticated;
grant execute on function public.auryn_submit_support(jsonb,text,text) to service_role;
