import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {ENGINE_VERSION,WEIGHTS_VERSION,RELIABILITY_MIN_SAMPLE} from "@/lib/nivora-version";
import {measureOutcome,scoreBucket} from "@/lib/v65/outcomes";

export const dynamic="force-dynamic";
const horizons=[["30D",30],["90D",90],["180D",180],["1Y",365],["2Y",730]] as const;
const day=86400000;
type DailyBar={date:string;close:number};

function auth(req:Request){
 const secret=process.env.TRADING_LAB_CRON_SECRET||process.env.CRON_SECRET;
 return Boolean(secret&&req.headers.get("authorization")===`Bearer ${secret}`);
}
function isoDate(d:Date){return d.toISOString().slice(0,10)}
async function series(symbol:string,start:string,end:string,key:string):Promise<DailyBar[]>{
 const u=new URL("https://api.twelvedata.com/time_series");
 u.searchParams.set("symbol",symbol);u.searchParams.set("interval","1day");u.searchParams.set("start_date",start);u.searchParams.set("end_date",end);u.searchParams.set("adjust","all");u.searchParams.set("outputsize","800");u.searchParams.set("apikey",key);
 const r=await fetch(u,{cache:"no-store",signal:AbortSignal.timeout(10000)}),j=await r.json();
 if(!r.ok||!Array.isArray(j?.values))throw new Error(j?.message||`No daily series for ${symbol}`);
 return j.values.slice().reverse().map((x:any)=>({date:String(x.datetime).slice(0,10),close:Number(x.close)})).filter((x:any)=>Number.isFinite(x.close)&&x.close>0);
}
function atOrAfter(rows:Array<{date:string;close:number}>,date:string){return rows.find(x=>x.date>=date)||null}
function clamp(x:number,a=0,b=100){return Math.max(a,Math.min(b,x))}

export async function GET(req:Request){
 if(!auth(req))return NextResponse.json({error:"Unauthorized."},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,td=process.env.TWELVE_DATA_API_KEY;
 if(!url||!key||!td)return NextResponse.json({status:"unavailable",reason:"Supabase service credentials and Twelve Data are required."},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const now=new Date(),oldest30=new Date(now.getTime()-30*day).toISOString();

 const {data:candidates,error}=await db.from("nivora_v59_decision_snapshots")
  .select("id,symbol,observed_at,price,benchmark_symbol,decision,evidence")
  .eq("engine_version",ENGINE_VERSION).lte("observed_at",oldest30).order("observed_at",{ascending:true}).limit(8);
 if(error)return NextResponse.json({status:"error",error:error.message},{status:500});
 const ids=(candidates||[]).map((x:any)=>Number(x.id));
 const {data:existing}=ids.length?await db.from("nivora_v59_arena_outcomes").select("snapshot_id,horizon").in("snapshot_id",ids):{data:[] as any[]};
 const existingSet=new Set((existing||[]).map((x:any)=>`${x.snapshot_id}|${x.horizon}`));
 let inserted=0,skipped=0,failed=0;
 const errors:string[]=[];

 for(const snap of candidates||[]){
  const observed=new Date(snap.observed_at),mature=horizons.filter(([,days])=>now.getTime()-observed.getTime()>=days*day&&!existingSet.has(`${snap.id}|${days===365?"1Y":days===730?"2Y":`${days}D`}`));
  if(!mature.length){skipped++;continue}
  try{
   const start=isoDate(new Date(observed.getTime()-3*day)),end=isoDate(now);
   const [stock,bench]=await Promise.all([series(String(snap.symbol),start,end,td),series(String(snap.benchmark_symbol||"SPY"),start,end,td)]);
   const benchStart=atOrAfter(bench,isoDate(observed));
   if(!benchStart)throw new Error(`No benchmark start bar for ${snap.symbol}`);
   for(const [horizon,days] of horizons){
    if(now.getTime()-observed.getTime()<days*day||existingSet.has(`${snap.id}|${horizon}`))continue;
    const target=isoDate(new Date(observed.getTime()+days*day)),endStock=atOrAfter(stock,target),endBench=atOrAfter(bench,target);
    if(!endStock||!endBench){skipped++;continue}
    const path=stock.filter((x:DailyBar)=>x.date<=endStock.date).map((x:DailyBar)=>x.close);
    const m=measureOutcome({entryPrice:Number(snap.price),endPrice:endStock.close,benchmarkStart:benchStart.close,benchmarkEnd:endBench.close,pathPrices:path});
    const {error:ie}=await db.from("nivora_v59_arena_outcomes").upsert({snapshot_id:snap.id,horizon,outcome_at:`${endStock.date}T21:00:00Z`,end_price:endStock.close,raw_return_pct:m.rawReturnPct,benchmark_return_pct:m.benchmarkReturnPct,alpha_pct:m.alphaPct,max_drawdown_pct:m.maxDrawdownPct,hit:m.hit},{onConflict:"snapshot_id,horizon"});
    if(ie)throw ie;inserted++;
   }
  }catch(e:any){failed++;errors.push(`${snap.symbol}: ${e?.message||e}`)}
 }

 // Rebuild current-engine reliability buckets from the current snapshot cohort.
 const {data:allSnaps}=await db.from("nivora_v59_decision_snapshots").select("id,decision").eq("engine_version",ENGINE_VERSION).order("observed_at",{ascending:false}).limit(1000);
 const snapMap=new Map((allSnaps||[]).map((x:any)=>[Number(x.id),x]));
 const allIds=[...snapMap.keys()];
 const outcomes:any[]=[];
 for(let i=0;i<allIds.length;i+=200){
  const {data:o}=await db.from("nivora_v59_arena_outcomes").select("snapshot_id,horizon,alpha_pct,hit").in("snapshot_id",allIds.slice(i,i+200));
  outcomes.push(...(o||[]));
 }
 const groups=new Map<string,any[]>();
 for(const o of outcomes){
  const d:any=snapMap.get(Number(o.snapshot_id))?.decision||{},archetype=String(d.archetype||"unknown"),bucket=scoreBucket(Number(d.thesisScore||0)),k=`${o.horizon}|${archetype}|${bucket}`;
  const xs=groups.get(k)||[];xs.push(o);groups.set(k,xs);
 }
 for(const [k,xs] of groups){
  const [horizon,archetype,bucket]=k.split("|"),n=xs.length,hitRate=xs.filter(x=>x.hit===true).length/n*100,avgAlpha=xs.reduce((s,x)=>s+Number(x.alpha_pct||0),0)/n;
  const reliability=clamp(hitRate*.65+clamp(50+avgAlpha*4)*.35);
  await db.from("nivora_v59_reliability_buckets").upsert({engine_version:ENGINE_VERSION,weights_version:WEIGHTS_VERSION,horizon,archetype,score_bucket:bucket,sample_n:n,hit_rate_pct:+hitRate.toFixed(1),avg_alpha_pct:+avgAlpha.toFixed(2),reliability_score:+reliability.toFixed(1),status:n>=RELIABILITY_MIN_SAMPLE?"CALIBRATED":"COLLECTING",calculated_at:new Date().toISOString()},{onConflict:"engine_version,weights_version,horizon,archetype,score_bucket"});
 }
 return NextResponse.json({status:"ok",engineVersion:ENGINE_VERSION,candidates:(candidates||[]).length,inserted,skipped,failed,reliabilityBuckets:groups.size,errors:errors.slice(0,10),note:"Matured outcomes update evidence only. V65 production weights are frozen; challenger promotion is explicit and versioned."},{headers:{"Cache-Control":"private, no-store"}});
}
