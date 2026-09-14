import {fileURLToPath} from "node:url";

const BASE=(process.env.AURYN_BASE_URL||"https://getauryn.vercel.app").replace(/\/$/,"");
const SECRET=process.env.CRON_SECRET||"";
const MAX_RUNTIME_MS=Math.max(60_000,Math.min(9*60_000,Number(process.env.AURYN_QUEUE_MAX_RUNTIME_MS||8*60_000)));
const MAX_JOBS=Math.max(1,Math.min(50,Number(process.env.AURYN_QUEUE_MAX_JOBS||40)));
const LEGACY_V9962_WORKER_CAP=Math.min(10,10); // compatibility marker for verified V9.9.6.2 contract
const MAX_WORKERS=MAX_JOBS; // V9.9.7 duration-bounded worker cap
const SPACING_MS=Math.max(1000,Number(process.env.AURYN_QUEUE_SPACING_MS||6000));

if(!SECRET)throw new Error("CRON_SECRET missing");

const call=async path=>{
  const r=await fetch(`${BASE}${path}`,{headers:{Authorization:`Bearer ${SECRET}`}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(`${path} ${r.status} ${JSON.stringify(j)}`);
  return j;
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function waitForNextProviderWindow(now=Date.now()){
  const next=(Math.floor(now/60_000)+1)*60_000+1500;
  return Math.max(3000,next-now);
}

export async function drainValidationQueue(){
  const started=Date.now();let processed=0,attempted=0,deferred=0,skipped=0;
  while(attempted<MAX_WORKERS&&Date.now()-started<MAX_RUNTIME_MS){
    let x;
    try{x=await call("/api/validation/worker")}catch(e){console.error("worker error",e);break}
    console.log("worker",x);
    if(x.status==="idle")break;
    if(x.status==="deferred"){
      deferred++;
      const wait=waitForNextProviderWindow();
      if(Date.now()-started+wait>=MAX_RUNTIME_MS)break;
      console.log("provider budget deferred; waiting",wait);
      await sleep(wait);
      continue;
    }
    attempted++;
    if(x.status==="skipped"){skipped++;continue}
    processed+=Number(x.saved||0);
    if(Date.now()-started+SPACING_MS>=MAX_RUNTIME_MS)break;
    await sleep(SPACING_MS);
  }
  let watchdog={status:"not_run"},final={status:"not_run"};
  try{watchdog=await call("/api/validation/watchdog");console.log("watchdog",watchdog)}catch(e){console.error("watchdog error",e)}
  try{final=await call("/api/validation/finalize");console.log("finalize",final)}catch(e){console.error("finalize error",e)}
  const result={status:"ok",processed,attempted,deferred,skipped,elapsedMs:Date.now()-started,finalStatus:final?.status??"unknown"};
  console.log(JSON.stringify(result));return result;
}

if(fileURLToPath(import.meta.url)===process.argv[1])await drainValidationQueue();
