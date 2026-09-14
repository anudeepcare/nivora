import {drainValidationQueue} from "./auryn-v996-queue-pump.mjs";

const BASE=(process.env.AURYN_BASE_URL||"https://getauryn.vercel.app").replace(/\/$/,"");
const SECRET=process.env.CRON_SECRET||"";
if(!SECRET)throw new Error("CRON_SECRET missing");
const kinds=["PREMARKET","LIVE_OPEN","LIVE_MIDDAY","LIVE_POWER_HOUR","DAILY_CLOSE","AFTER_HOURS","NIGHTLY","WEEKLY"];

async function call(path){
 const r=await fetch(`${BASE}${path}`,{headers:{Authorization:`Bearer ${SECRET}`}});
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(`${path} ${r.status} ${JSON.stringify(j)}`);
 return j;
}

for(const kind of kinds){
 try{
  const x=await call(`/api/validation/orchestrate?kind=${encodeURIComponent(kind)}`);
  if(x.status!=="skipped"&&x.status!=="already_completed")console.log("orchestrate",kind,x);
 }catch(e){console.error("orchestrate error",kind,e)}
}
await drainValidationQueue();
