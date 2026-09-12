const BASE=(process.env.AURYN_BASE_URL||"https://getauryn.vercel.app").replace(/\/$/,""),SECRET=process.env.CRON_SECRET||"",MAX_WORKERS=Math.max(1,Math.min(5,Number(process.env.AURYN_QUEUE_BURST||4)));
if(!SECRET)throw new Error("CRON_SECRET missing");
const call=async path=>{const r=await fetch(`${BASE}${path}`,{headers:{Authorization:`Bearer ${SECRET}`}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`${path} ${r.status} ${JSON.stringify(j)}`);return j};
let processed=0;
for(let i=0;i<MAX_WORKERS;i++){const x=await call("/api/validation/worker");console.log("worker",x);if(x.status==="idle"||x.status==="deferred")break;processed+=Number(x.saved||0);await new Promise(r=>setTimeout(r,12000));}
const watchdog=await call("/api/validation/watchdog");console.log("watchdog",watchdog);
const final=await call("/api/validation/finalize");console.log("finalize",final);
console.log(JSON.stringify({status:"ok",processed,finalStatus:final.status}));
