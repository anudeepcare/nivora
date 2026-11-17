create table if not exists auryn_product_private.provider_minutes(bucket timestamptz primary key,used integer not null,background integer not null);
create or replace function public.auryn_reserve_provider(p_background boolean default false)
returns boolean language plpgsql security definer set search_path=public,auryn_product_private,pg_temp as $$
declare b timestamptz:=date_trunc('minute',clock_timestamp());u integer;bg integer;begin
 perform pg_advisory_xact_lock(799102432);
 delete from auryn_product_private.provider_minutes where bucket<b-interval '10 minutes';
 insert into auryn_product_private.provider_minutes values(b,0,0) on conflict do nothing;
 select used,background into u,bg from auryn_product_private.provider_minutes where bucket=b for update;
 if u>=55 or (p_background and bg>=42) then return false;end if;
 update auryn_product_private.provider_minutes set used=used+1,background=background+case when p_background then 1 else 0 end where bucket=b;
 return true;end $$;
revoke all on function public.auryn_reserve_provider(boolean) from public,anon,authenticated;
grant execute on function public.auryn_reserve_provider(boolean) to service_role;
