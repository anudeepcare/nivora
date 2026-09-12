import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";import {evaluateRunCompletion} from "@/lib/auryn/v996/finalization";
export const dynamic="force-dynamic";export const runtime="nodejs";
const auth=(r:Request)=>Boolean(process.env.CRON_SECRET)&&r.headers.get("authorization")===`Bearer ${process.env.CRON_SECRET}`;
export async function GET(req:Request){
 if(!auth(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({error:"Supabase service configuration missing"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),u=new URL(req.url),requested=u.searchParams.get("runId");
 let q=db.from("auryn_validation_runs").select("id,status,expected_symbols,run_kind,evaluation_date,model_version,attempt").eq("status","RUNNING").order("started_at",{ascending:false}).limit(1);
 if(requested)q=db.from("auryn_validation_runs").select("id,status,expected_symbols,run_kind,evaluation_date,model_version,attempt").eq("id",requested).limit(1);
 const {data:runs,error}=await q;if(error)return NextResponse.json({error:error.message},{status:500});const run=runs?.[0];if(!run)return NextResponse.json({status:"idle"});
 const [{data:jobs,error:je},{data:snaps,error:se}]=await Promise.all([
  db.from("auryn_validation_jobs").select("status,metrics,error").eq("run_id",run.id),
  db.from("auryn_shadow_snapshots").select("symbol,market_price,new_money_action,owner_action,long_term_action,decision_score,evidence_completeness,setup_state,evidence_fingerprint,snapshot_fingerprint").eq("run_id",run.id)
 ]);
 if(je||se)return NextResponse.json({error:je?.message||se?.message},{status:500});
 const result=evaluateRunCompletion({expected:Number(run.expected_symbols||0),jobs:jobs||[],snapshots:snaps||[]});
 const report={version:"auryn-v9.9.6",runId:run.id,attempt:run.attempt,expected:Number(run.expected_symbols||0),...result,generatedAt:new Date().toISOString()};
 if(result.status!=="RUNNING")await db.from("auryn_validation_runs").update({status:result.status,processed_symbols:result.completeSnapshots,failed_symbols:Math.max(0,Number(run.expected_symbols||0)-result.completeSnapshots),completed_at:new Date().toISOString(),report}).eq("id",run.id).eq("status","RUNNING");
 return NextResponse.json(report);
}
