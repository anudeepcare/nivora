-- Optional required-mode provider-wide budget/cooldown. No raw provider keys stored.
begin;
create table if not exists public.auryn_sentisense_buckets (
 key text primary key check(key ~ '^[a-f0-9]{64}$'),
 used integer not null default 0 check(used>=0),
 window_limit integer not null default 20 check(window_limit between 1 and 2000),
 window_until timestamptz not null default '-infinity',
 cooldown_until timestamptz not null default '-infinity'
);
alter table public.auryn_sentisense_buckets enable row level security;
revoke all on public.auryn_sentisense_buckets from public,anon,authenticated;
grant select,insert,update on public.auryn_sentisense_buckets to service_role;
create or replace function public.auryn_sentisense_reserve(p_account text,p_credential text,p_max integer)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare at_time timestamptz; blocked_until timestamptz; retry integer;
begin
 if p_account is null or p_credential is null or p_max is null or p_account !~ '^[a-f0-9]{64}$' or p_credential !~ '^[a-f0-9]{64}$' or p_account=p_credential or p_max<1 or p_max>2000 then raise exception 'Invalid provider guard parameters'; end if;
 insert into public.auryn_sentisense_buckets(key) select k from unnest(array[p_account,p_credential]) k order by k on conflict(key) do nothing;
 -- Same lock order for all keys and both RPCs prevents opposite-key deadlocks.
 perform key from public.auryn_sentisense_buckets where key in(p_account,p_credential) order by key for update;
 at_time:=clock_timestamp();
 select max(cooldown_until) into blocked_until from public.auryn_sentisense_buckets where key in(p_account,p_credential);
 if blocked_until>at_time then return jsonb_build_object('allowed',false,'retryAfterSeconds',greatest(1,ceil(extract(epoch from blocked_until-at_time))::integer)); end if;
 update public.auryn_sentisense_buckets set used=case when window_until<=at_time then 0 else used end,
 window_limit=case when window_until<=at_time then p_max else least(window_limit,p_max) end,
 window_until=case when window_until<=at_time then at_time+interval '60 seconds' else window_until end
 where key in(p_account,p_credential);
 select max(window_until) into blocked_until from public.auryn_sentisense_buckets where key in(p_account,p_credential) and used>=window_limit;
 if blocked_until is not null then return jsonb_build_object('allowed',false,'retryAfterSeconds',greatest(1,ceil(extract(epoch from blocked_until-at_time))::integer)); end if;
 update public.auryn_sentisense_buckets set used=used+1 where key in(p_account,p_credential);
 return jsonb_build_object('allowed',true,'retryAfterSeconds',0);
end $$;
create or replace function public.auryn_sentisense_cooldown(p_account text,p_credential text,p_seconds integer)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
declare at_time timestamptz;
begin
 if p_account is null or p_credential is null or p_seconds is null or p_account !~ '^[a-f0-9]{64}$' or p_credential !~ '^[a-f0-9]{64}$' or p_account=p_credential or p_seconds<1 or p_seconds>86400 then raise exception 'Invalid provider guard parameters'; end if;
 insert into public.auryn_sentisense_buckets(key) select k from unnest(array[p_account,p_credential]) k order by k on conflict(key) do nothing;
 perform key from public.auryn_sentisense_buckets where key in(p_account,p_credential) order by key for update;
 at_time:=clock_timestamp();
 update public.auryn_sentisense_buckets set cooldown_until=greatest(cooldown_until,at_time+p_seconds*interval '1 second') where key in(p_account,p_credential);
 return true;
end $$;
revoke all on function public.auryn_sentisense_reserve(text,text,integer) from public,anon,authenticated;
revoke all on function public.auryn_sentisense_cooldown(text,text,integer) from public,anon,authenticated;
grant execute on function public.auryn_sentisense_reserve(text,text,integer) to service_role;
grant execute on function public.auryn_sentisense_cooldown(text,text,integer) to service_role;
commit;
