// Reports presence/validity only. Never prints credentials or their prefixes.
const env=process.env;
const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','AURYN_OWNER_USER_ID'];
if(env.AURYN_OPTIONS_ENABLED==='true')required.push(...(env.AURYN_OPTIONS_PROVIDER==='eodhd'?[env.EODHD_API_TOKEN&&!env.EODHD_API_KEY?'EODHD_API_TOKEN':'EODHD_API_KEY']:['ALPACA_PAPER_API_KEY','ALPACA_PAPER_API_SECRET']));
if(env.AURYN_THESIS_JOB_ENABLED==='true')required.push('CRON_SECRET');
const checks=required.map(name=>({name,status:env[name]?.trim()?'present':'missing'}));
checks.push({name:'AURYN_MARKET_SNAPSHOT_SIGNING_KEY',status:(env.AURYN_MARKET_SNAPSHOT_SIGNING_KEY?.length??0)>=32?'valid length':'missing or shorter than 32 characters'});
console.log(JSON.stringify({checks,options:env.AURYN_OPTIONS_ENABLED==='true',thesisSchedule:env.AURYN_THESIS_JOB_ENABLED==='true',publicObservations:env.AURYN_EXTERNAL_DATA_LICENSED==='true',note:'Presence checks only; provider permissions and live connectivity are not tested.'},null,2));
if(checks.some(c=>!['present','valid length'].includes(c.status)))process.exitCode=1;
