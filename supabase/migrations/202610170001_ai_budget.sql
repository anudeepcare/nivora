-- Additive migration. Apply to a staging project first. Does not alter existing account records.
create schema if not exists auryn_product_private;
revoke all on schema auryn_product_private from public, anon, authenticated;
create table if not exists auryn_product_private.ai_daily_usage (
  day date not null,
  scope text not null,
  used integer not null default 0 check (used >= 0),
  primary key (day, scope)
);
alter table auryn_product_private.ai_daily_usage enable row level security;
revoke all on auryn_product_private.ai_daily_usage from public, anon, authenticated;
create or replace function public.auryn_reserve_ai_request()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  today date := (now() at time zone 'UTC')::date;
  global_used integer;
  user_used integer;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Verified account required' using errcode = '42501';
  end if;
  -- Serialize reservations in a consistent global-then-account lock order.
  insert into auryn_product_private.ai_daily_usage(day, scope) values (today, 'global') on conflict do nothing;
  select used into global_used from auryn_product_private.ai_daily_usage where day=today and scope='global' for update;
  if global_used >= 100 then return false; end if;
  insert into auryn_product_private.ai_daily_usage(day, scope) values (today, actor::text) on conflict do nothing;
  select used into user_used from auryn_product_private.ai_daily_usage where day=today and scope=actor::text for update;
  if user_used >= 3 then return false; end if;
  update auryn_product_private.ai_daily_usage set used=used+1 where day=today and scope in ('global',actor::text);
  return true;
end;
$$;
revoke all on function public.auryn_reserve_ai_request() from public, anon;
grant execute on function public.auryn_reserve_ai_request() to authenticated;
