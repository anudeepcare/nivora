-- Optional owner-preview target cache. No new public data access or provider budget.
-- Apply before deploying code to enable cross-instance reuse; never resets usage.
begin;
create or replace function public.auryn_preview_targets_read(p_key text,p_denial_key text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c auryn_product_private.market_cache%rowtype;
begin
 if p_key !~ '^sentisense:preview:v1:[a-f0-9]{64}:[A-Z][A-Z0-9.-]{0,14}$' or p_denial_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid preview identity';end if;
 delete from auryn_product_private.market_cache where key like 'sentisense:preview:v1:%' and expires_at<=clock_timestamp();
 if exists(select 1 from public.auryn_request_limits where key=p_denial_key and expires_at>clock_timestamp()) then return null;end if;
 select * into c from auryn_product_private.market_cache where key=p_key and expires_at>clock_timestamp();
 if c.payload is null then return null;end if;
 return jsonb_build_object('value',c.payload,'expiresAt',c.expires_at);
end $$;
create or replace function public.auryn_preview_targets_write(p_key text,p_value jsonb,p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path='' as $$
declare clean jsonb;
begin
 if p_key !~ '^sentisense:preview:v1:[a-f0-9]{64}:[A-Z][A-Z0-9.-]{0,14}$' or p_expires_at is null or p_expires_at<=clock_timestamp() or p_expires_at>clock_timestamp()+interval '24 hours' then raise exception 'Invalid preview expiry or identity';end if;
 if jsonb_typeof(p_value) is distinct from 'object' or pg_column_size(p_value)>4096 or
 p_value->>'symbol' is distinct from split_part(p_key,':',5) or p_value->>'currency' is distinct from 'USD' or
 p_value->>'source' is distinct from 'SentiSense' or p_value->>'sourceField' is distinct from 'consensus.targetMean' or
 p_value->>'timestampBasis' is distinct from 'dataset-refresh' or p_value->>'updatedAt' is null or
 jsonb_typeof(p_value->'low') is distinct from 'number' or jsonb_typeof(p_value->'target') is distinct from 'number' or jsonb_typeof(p_value->'high') is distinct from 'number' then raise exception 'Invalid target observation';end if;
 if (p_value->>'low')::numeric<=0 or (p_value->>'low')::numeric>(p_value->>'target')::numeric or (p_value->>'target')::numeric>(p_value->>'high')::numeric then raise exception 'Invalid target bounds';end if;
 clean=jsonb_build_object('symbol',p_value->'symbol','currency','USD','source','SentiSense','sourceField','consensus.targetMean','timestampBasis','dataset-refresh','updatedAt',p_value->'updatedAt','low',p_value->'low','target',p_value->'target','high',p_value->'high','analysts',p_value->'analysts');
 insert into auryn_product_private.market_cache(key,payload,expires_at,updated_at) values(p_key,clean,p_expires_at,clock_timestamp())
 on conflict(key) do update set payload=excluded.payload,expires_at=excluded.expires_at,updated_at=excluded.updated_at;
 delete from auryn_product_private.market_cache where key like 'sentisense:preview:v1:%' and expires_at<=clock_timestamp();
 return true;
end $$;
revoke all on function public.auryn_preview_targets_read(text,text),public.auryn_preview_targets_write(text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.auryn_preview_targets_read(text,text),public.auryn_preview_targets_write(text,jsonb,timestamptz) to service_role;
commit;
