begin;
-- Private opt-in jobs; trigger follows existing account-owned document RLS.
create table public.auryn_thesis_queue (
 user_id uuid not null, symbol text not null,
 due_at timestamptz not null default now(), lease_until timestamptz,
 lease_token uuid, attempts integer not null default 0,
 last_checked_at timestamptz, last_ok boolean,
 primary key(user_id,symbol)
);
alter table public.auryn_thesis_queue enable row level security;
revoke all on public.auryn_thesis_queue from public,anon,authenticated;
grant all on public.auryn_thesis_queue to service_role;
create index auryn_thesis_queue_due on public.auryn_thesis_queue(due_at);
create function public.auryn_sync_thesis_queue() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if TG_OP='DELETE' then
  if OLD.kind='note' then delete from public.auryn_thesis_queue where user_id=OLD.user_id and symbol=OLD.key; end if;
  return OLD;
 end if;
 if TG_OP='UPDATE' and (OLD.user_id,OLD.kind,OLD.key) is distinct from (NEW.user_id,NEW.kind,NEW.key) then
  if OLD.kind='note' then delete from public.auryn_thesis_queue where user_id=OLD.user_id and symbol=OLD.key; end if;
 end if;
 if NEW.kind='note' then
  if NEW.body->>'monitorEnabled'='true' and NEW.key ~ '^[A-Z][A-Z0-9.-]{0,14}$' then
   insert into public.auryn_thesis_queue(user_id,symbol) values(NEW.user_id,NEW.key) on conflict do nothing;
  else delete from public.auryn_thesis_queue where user_id=NEW.user_id and symbol=NEW.key;
  end if;
 end if;
 return NEW;
end $$;
revoke all on function public.auryn_sync_thesis_queue() from public,anon,authenticated;
create trigger auryn_thesis_opt_in after insert or update or delete on public.auryn_documents for each row execute function public.auryn_sync_thesis_queue();
insert into public.auryn_thesis_queue(user_id,symbol)
select user_id,key from public.auryn_documents where kind='note' and body->>'monitorEnabled'='true' and key ~ '^[A-Z][A-Z0-9.-]{0,14}$' on conflict do nothing;
create function public.auryn_claim_theses(p_limit integer default 4)
returns table(user_id uuid,symbol text,lease_token uuid) language sql security invoker set search_path=pg_catalog,public as $$
 with due as (select q.user_id,q.symbol from public.auryn_thesis_queue q where q.due_at<=now() and (q.lease_until is null or q.lease_until<now()) order by q.due_at,q.user_id,q.symbol for update skip locked limit least(greatest(coalesce(p_limit,4),1),4))
 update public.auryn_thesis_queue q set lease_until=now()+interval '5 minutes',lease_token=gen_random_uuid(),attempts=q.attempts+1 from due where q.user_id=due.user_id and q.symbol=due.symbol returning q.user_id,q.symbol,q.lease_token;
$$;
create function public.auryn_finish_thesis(p_user uuid,p_symbol text,p_lease uuid,p_ok boolean)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
declare n integer;
begin
 update public.auryn_thesis_queue set due_at=now()+case when p_ok then interval '24 hours' else interval '15 minutes' end,lease_until=null,lease_token=null,last_checked_at=now(),last_ok=p_ok where user_id=p_user and symbol=p_symbol and lease_token=p_lease and lease_until>now();
 get diagnostics n=row_count; return n=1;
end $$;
revoke all on function public.auryn_claim_theses(integer) from public,anon,authenticated;
revoke all on function public.auryn_finish_thesis(uuid,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.auryn_claim_theses(integer) to service_role;
grant execute on function public.auryn_finish_thesis(uuid,text,uuid,boolean) to service_role;
create function public.auryn_publish_thesis_alert(p_user uuid,p_symbol text,p_lease uuid,p_revision timestamptz,p_event jsonb)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 -- Lock note before queue, matching the document update trigger lock order.
 perform 1 from public.auryn_documents where user_id=p_user and kind='note' and key=p_symbol and updated_at=p_revision and body->>'monitorEnabled'='true' for share;
 if not found then return false; end if;
 perform 1 from public.auryn_thesis_queue where user_id=p_user and symbol=p_symbol and lease_token=p_lease and lease_until>now() for update;
 if not found then return false; end if;
 insert into public.auryn_alert_events(user_id,rule_key,event_key,symbol,snapshot_id,title,detail)
 values(p_user,'thesis:'||p_symbol,p_event->>'event_key',p_symbol,p_event->>'snapshot_id',p_event->>'title',p_event->>'detail') on conflict(user_id,rule_key,event_key) do nothing;
 return true;
end $$;
revoke all on function public.auryn_publish_thesis_alert(uuid,text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.auryn_publish_thesis_alert(uuid,text,uuid,timestamptz,jsonb) to service_role;
commit;

