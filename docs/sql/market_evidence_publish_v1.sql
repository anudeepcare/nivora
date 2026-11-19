-- SOURCE-ONLY CANDIDATE, NOT APPLIED TO ANY DEPLOYED DATABASE.
-- Generate a named migration using the Supabase CLI before release.
-- Separate RPC: legacy auryn_market_publish semantics remain untouched.
create or replace function public.auryn_market_publish_evidence_v1(
 p_key text,p_lease uuid,p_value jsonb,p_ttl integer
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c auryn_product_private.market_cache%rowtype;expiry timestamptz;
begin
 if p_key is null or length(p_key)>200 or p_lease is null or p_ttl is null or p_ttl<0 or p_ttl>86400 then
  return jsonb_build_object('stored',false,'reason','invalid-arguments');
 end if;
 select * into c from auryn_product_private.market_cache where key=p_key for update;
 if not found or c.lease is distinct from p_lease then
  return jsonb_build_object('stored',false,'reason','lease-unavailable');
 end if;
 -- Releasing a matching reservation cannot claim a persisted observation.
 if p_value is null then
  update auryn_product_private.market_cache set payload=null,expires_at='-infinity',lease=null,lease_until='-infinity',updated_at=clock_timestamp() where key=p_key and lease=p_lease;
  return jsonb_build_object('stored',false,'reason','released');
 end if;
 if c.lease_until<=clock_timestamp() then
  return jsonb_build_object('stored',false,'reason','lease-unavailable');
 end if;
 if p_ttl=0 then return jsonb_build_object('stored',false,'reason','invalid-arguments');end if;
 if pg_column_size(p_value)>5242880 then
  return jsonb_build_object('stored',false,'reason','payload-too-large');
 end if;
 update auryn_product_private.market_cache set payload=p_value,
  expires_at=clock_timestamp()+make_interval(secs=>p_ttl),lease=null,lease_until='-infinity',updated_at=clock_timestamp()
 where key=p_key and lease=p_lease and lease_until>clock_timestamp()
 returning expires_at into expiry;
 if not found then return jsonb_build_object('stored',false,'reason','lease-unavailable');end if;
 return jsonb_build_object('stored',true,'expiresAt',expiry);
end $$;
revoke all on function public.auryn_market_publish_evidence_v1(text,uuid,jsonb,integer) from public,anon,authenticated;
grant execute on function public.auryn_market_publish_evidence_v1(text,uuid,jsonb,integer) to service_role;
