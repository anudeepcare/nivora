import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";import {loadAurynCanonicalSnapshot} from "@/lib/auryn/v935/canonical";
export const dynamic="force-dynamic";export const runtime="nodejs";
function authorized(req:Request){const s=process.env.CRON_SECRET;return Boolean(s)&&req.headers.get("authorization")===`Bearer ${s}`}
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}

const priceOf=(s:any)=>{for(const x of [s?.market?.decisionPrice,s?.market?.displayPrice,s?.market?.regularClosePrice,s?.market?.regularClose]){const n=Number(x);if(Number.isFinite(n)&&n>0)return n}return null};
export async function GET(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});const client=db();if(!client)return NextResponse.json({error:"Supabase service configuration missing"},{status:503});
 const today=new Date().toISOString().slice(0,10);
 const {data:due,error}=await client.from("auryn_shadow_outcomes").select("id,horizon,due_date,snapshot_id,auryn_shadow_snapshots!inner(symbol,market_price)").eq("status","PENDING").lte("due_date",today).order("due_date").limit(12);
 if(error)return NextResponse.json({error:error.message},{status:500});if(!due?.length)return NextResponse.json({status:"idle"});
 const {data:budget}=await client.rpc("auryn_acquire_provider_tokens",{requested:due.length,background_limit:42});if(budget!==true)return NextResponse.json({status:"deferred",reason:"background provider budget unavailable"});
 let measured=0,unavailable=0;
 for(const row of due as any[]){try{const snap=await loadAurynCanonicalSnapshot(String(row.auryn_shadow_snapshots.symbol));const current=priceOf(snap),start=Number(row.auryn_shadow_snapshots.market_price);if(!(current&&Number.isFinite(start)&&start>0)){unavailable++;continue;}const ret=(current/start-1)*100;await client.from("auryn_shadow_outcomes").update({status:"MEASURED",outcome_price:current,security_return_pct:ret,measured_at:new Date().toISOString(),evidence:{canonicalSnapshotId:(snap as any).snapshotId}}).eq("id",row.id);measured++;}catch{unavailable++;}}
 return NextResponse.json({status:"ok",measured,unavailable});
}
