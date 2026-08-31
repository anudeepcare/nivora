import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
function wilson(w:number,n:number){if(!n)return null;const z=1.96,p=w/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return{lowPct:+((c-m)*100).toFixed(1),highPct:+((c+m)*100).toFixed(1)}}
export async function GET(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({status:"unavailable",reason:"Calibration storage is not configured."});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const q=new URL(req.url).searchParams,engine=q.get("engine")||"v55";
 const [{data:h},{data:o}]=await Promise.all([db.from("nivora_decision_history").select("id,thesis_score,action,archetype,engine_version,weights_version").eq("engine_version",engine).limit(20000),db.from("nivora_decision_outcomes").select("history_id,horizon_days,return_pct,benchmark_return_pct,excess_return_pct").limit(100000)]);
 const history=new Map((h||[]).map((x:any)=>[Number(x.id),x])),result:any={};
 for(const days of [30,90,180,365]){const rows=(o||[]).filter((x:any)=>Number(x.horizon_days)===days&&history.has(Number(x.history_id)));const buckets=new Map<string,{n:number,w:number,sum:number,alphaN:number}>();
  for(const x of rows){const hh:any=history.get(Number(x.history_id)),s=Number(hh?.thesis_score||0),score=`${Math.floor(clamp(s)/10)*10}-${Math.min(100,Math.floor(clamp(s)/10)*10+9)}`,arch=hh?.archetype||"unknown",k=`${arch}|${score}`,b=buckets.get(k)||{n:0,w:0,sum:0,alphaN:0};const raw=Number(x.return_pct||0),ex=Number.isFinite(Number(x.excess_return_pct))?Number(x.excess_return_pct):Number.isFinite(Number(x.benchmark_return_pct))?raw-Number(x.benchmark_return_pct):NaN;b.n++;if(Number.isFinite(ex)){b.w+=ex>0?1:0;b.sum+=ex;b.alphaN++}buckets.set(k,b)}
  result[days]={n:rows.length,buckets:[...buckets.entries()].map(([k,b])=>{const[archetype,score]=k.split("|");return{archetype,score,n:b.n,benchmarkComparableN:b.alphaN,alphaHitRatePct:b.alphaN?+(b.w/b.alphaN*100).toFixed(1):null,avgExcessReturnPct:b.alphaN?+(b.sum/b.alphaN).toFixed(2):null,confidence95:wilson(b.w,b.alphaN)}})};
 }
 const comparable90=(result[90]?.buckets||[]).reduce((a:number,b:any)=>a+(b.benchmarkComparableN||0),0);return NextResponse.json({status:comparable90>=200?"calibrating":"collecting",engineVersion:engine,modelConfidence:comparable90>=200?"Calibration evidence available":"Uncalibrated",note:"Calibration is benchmark-relative and isolated by engine version, archetype and score bucket. It is not a promise of future performance.",minimumRecommendedComparableObservations:200,outcomes:result},{headers:{"Cache-Control":"private, max-age=300"}})
}
