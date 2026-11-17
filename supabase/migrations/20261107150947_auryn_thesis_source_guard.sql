begin;
-- A caller-controlled updated_at alone is not a reliable content revision.
create or replace function public.auryn_publish_thesis_alert(p_user uuid,p_symbol text,p_lease uuid,p_revision timestamptz,p_event jsonb)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
declare active_until timestamptz;
begin
 perform 1 from public.auryn_documents
 where user_id=p_user and kind='note' and key=p_symbol
   and updated_at=p_revision and body->>'monitorEnabled'='true'
   and body=p_event->'source_body'
 for share;
 if not found then return false; end if;
 -- Lock first, then evaluate wall-clock expiry, including time spent waiting.
 select lease_until into active_until from public.auryn_thesis_queue
 where user_id=p_user and symbol=p_symbol and lease_token=p_lease for update;
 if not found or active_until is null or active_until<=clock_timestamp() then return false; end if;
 insert into public.auryn_alert_events(user_id,rule_key,event_key,symbol,snapshot_id,title,detail)
 values(p_user,'thesis:'||p_symbol,p_event->>'event_key',p_symbol,p_event->>'snapshot_id',p_event->>'title',p_event->>'detail') on conflict(user_id,rule_key,event_key) do nothing;
 return true;
end $$;
revoke all on function public.auryn_publish_thesis_alert(uuid,text,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.auryn_publish_thesis_alert(uuid,text,uuid,timestamptz,jsonb) to service_role;
commit;
