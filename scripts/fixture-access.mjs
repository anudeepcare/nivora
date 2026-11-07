// Synthetic access transport for provider-route tests. Real gating is exercised
// independently in test-access-api and server-hardening tests.
export function setupFixtureAccess(){
 process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service';
 process.env.AURYN_OWNER_USER_ID='00000000-0000-4000-8000-000000000099';
 process.env.AURYN_ACCESS_ENABLED='true';
 process.env.AURYN_EXTERNAL_DATA_LICENSED='true';
 process.env.AURYN_SHARED_MARKET_GUARD='false';
}
export function fixtureAccessResponse(input){
 if(process.env.SUPABASE_SERVICE_ROLE_KEY!=='fixture-service')return null;
 const p=new URL(String(input)).pathname;
 if(p.endsWith('/rpc/auryn_reserve_provider'))return Response.json(true);
 if(p.endsWith('/rpc/auryn_request_allow'))return Response.json(true);
 if(p.endsWith('/auryn_access_config'))return Response.json({body:{mode:'beta'},enforced:true,owner_id:process.env.AURYN_OWNER_USER_ID});
 if(p.endsWith('/auryn_beta_grants'))return Response.json({expires_at:new Date(Date.now()+86400000).toISOString(),revoked_at:null});
 if(p.endsWith('/auryn_stripe_subscriptions'))return Response.json(null);
 if(p.endsWith('/rpc/auryn_access_reserve'))return Response.json({allowed:true,used:1});
 return null;
}
