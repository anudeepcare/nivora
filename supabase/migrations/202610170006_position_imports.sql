create table if not exists auryn_product_private.position_imports(user_id uuid not null references auth.users(id) on delete cascade,request_id uuid not null,payload jsonb not null,created_at timestamptz not null default now(),primary key(user_id,request_id));
create or replace function public.auryn_import_positions(p_request uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path=public,auryn_product_private,pg_temp as $$
declare uid uuid:=auth.uid();previous jsonb;r jsonb;n integer;begin
 if uid is null then raise exception 'Authentication required';end if;
 if p_request is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>200 or octet_length(p_rows::text)>100000 then raise exception 'Invalid import';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text||p_request::text,0));
 select payload into previous from auryn_product_private.position_imports where user_id=uid and request_id=p_request;
 if found then if previous<>p_rows then raise exception 'Import identifier already used for different content';end if;return jsonb_array_length(previous);end if;
 for r in select * from jsonb_array_elements(p_rows) loop
  if coalesce(r->>'symbol','')!~'^[A-Z0-9][A-Z0-9.-]{0,14}(/[A-Z]{3,5})?$' or coalesce(r->>'currency','')<>'USD' or coalesce((r->>'quantity')::numeric,0)<=0 or (r->>'cost') is null or (r->>'cost')::numeric<0 then raise exception 'Invalid position';end if;
  insert into portfolio_positions(user_id,symbol,shares,avg_cost,currency,asset_type) values(uid,r->>'symbol',(r->>'quantity')::numeric,(r->>'cost')::numeric,'USD',case when position('/' in r->>'symbol')>0 then 'CRYPTO' else 'EQUITY' end);
 end loop;
 insert into auryn_product_private.position_imports(user_id,request_id,payload) values(uid,p_request,p_rows);
 return jsonb_array_length(p_rows);end $$;
revoke all on function public.auryn_import_positions(uuid,jsonb) from public,anon;
grant execute on function public.auryn_import_positions(uuid,jsonb) to authenticated;
