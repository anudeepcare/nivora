import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({status:"unavailable",reason:"Calibration storage is not configured."});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [{data:h},{data:o}]=await Promise.all([
   db.from("nivora_decision_history").select("id,thesis_score,action,horizon_3m,horizon_6m,horizon_1y,horizon_2y,horizon_3y").limit(10000),
   db.from("nivora_decision_outcomes").select("history_id,horizon_days,return_pct").limit(50000)
 ]);
 const history=new Map((h||[]).map((x:any)=>[Number(x.id),x]));
 const horizons=[30,90,180,365];
 const result:any={};
 for(const days of horizons){
   const rows=(o||[]).filter((x:any)=>Number(x.horizon_days)===days&&history.has(Number(x.history_id)));
   const buckets=new Map<string,{n:number,wins:number,sum:number}>();
   for(const x of rows){const hh:any=history.get(Number(x.history_id));const s=Number(hh?.thesis_score||0);const key=`${Math.floor(clamp(s)/10)*10}-${Math.min(100,Math.floor(clamp(s)/10)*10+9)}`;const b=buckets.get(key)||{n:0,wins:0,sum:0};const r=Number(x.return_pct||0);b.n++;b.wins+=r>0?1:0;b.sum+=r;buckets.set(key,b)}
   result[days]={n:rows.length,buckets:[...buckets.entries()].map(([score,b])=>({score,n:b.n,hitRatePct:b.n?Number((b.wins/b.n*100).toFixed(1)):null,avgReturnPct:b.n?Number((b.sum/b.n).toFixed(2)):null}))};
 }
 const n90=result[90]?.n||0;
 return NextResponse.json({status:n90>=200?"calibrating":"collecting",modelConfidence:n90>=200?"Calibration available":"Uncalibrated",minimumRecommendedObservations:200,outcomes:result},{headers:{"Cache-Control":"private, max-age=300"}});
}
