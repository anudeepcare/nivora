-- Existing account tables and ownership policies are retained. One atomic operation prevents duplicate default lists.
create or replace function public.auryn_set_watch(p_symbol text,p_saved boolean)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare actor uuid := auth.uid(); target uuid;
begin
  if actor is null then raise exception 'Account required' using errcode='42501'; end if;
  if p_symbol is null or p_symbol !~ '^[A-Z0-9][A-Z0-9.-]{0,14}(/[A-Z]{3,5})?$' or p_saved is null then raise exception 'Invalid watch request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text || ':auryn-watchlist',0));
  if not p_saved then
    delete from public.watchlist_items where user_id=actor and symbol=p_symbol;
    return true;
  end if;
  if exists(select 1 from public.watchlist_items where user_id=actor and symbol=p_symbol) then return true; end if;
  select id into target from public.watchlists where user_id=actor order by created_at,id limit 1;
  if target is null then insert into public.watchlists(user_id,name) values(actor,'My Watchlist') returning id into target; end if;
  insert into public.watchlist_items(user_id,watchlist_id,symbol) values(actor,target,p_symbol) on conflict(watchlist_id,symbol) do nothing;
  return true;
end;
$$;
revoke all on function public.auryn_set_watch(text,boolean) from public,anon;
grant execute on function public.auryn_set_watch(text,boolean) to authenticated;
-- Additional tenant check, combined with existing permissive user_id ownership policy.
drop policy if exists auryn_watchlist_membership on public.watchlist_items;
create policy auryn_watchlist_membership on public.watchlist_items as restrictive for all to authenticated
using(exists(select 1 from public.watchlists w where w.id=watchlist_id and w.user_id=auth.uid()))
with check(exists(select 1 from public.watchlists w where w.id=watchlist_id and w.user_id=auth.uid()));
