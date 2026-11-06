-- Optional user-selected screenshots inherit the server-only support table permissions.
alter table public.auryn_support_requests add column if not exists screenshot text;
alter table public.auryn_support_requests add constraint auryn_support_screenshot_bounded check(screenshot is null or (length(screenshot)<=410000 and screenshot like 'data:image/jpeg;base64,/9j/%'));
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
 insert into auryn_support_requests(id,email,category,message,page,sender_hash,request_hash,screenshot)
 values((p_body->>'id')::uuid,p_body->>'email',p_body->>'category',p_body->>'message',p_body->>'page',p_sender,p_hash,nullif(p_body->>'screenshot','')) returning id into result;
 return result;
end;$$;
revoke all on function public.auryn_submit_support(jsonb,text,text) from public,anon,authenticated;
grant execute on function public.auryn_submit_support(jsonb,text,text) to service_role;
