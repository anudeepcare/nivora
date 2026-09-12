import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";export const runtime="nodejs";
function authorized(req:Request){const s=process.env.CRON_SECRET;return Boolean(s)&&req.headers.get("authorization")===`Bearer ${s}`}
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}

export async function GET(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});const client=db();if(!client)return NextResponse.json({error:"Supabase service configuration missing"},{status:503});
 const now=new Date().toISOString();
 const stale=await client.from("auryn_validation_jobs").update({status:"PENDING",leased_at:null,lease_expires_at:null,available_at:now,error:"LEASE_EXPIRED_RETRY"}).eq("status","RUNNING").lt("lease_expires_at",now).select("id");
 const retry=await client.from("auryn_validation_jobs").update({status:"PENDING",available_at:now}).eq("status","FAILED").lt("attempt",5).select("id");
 const {data:runs}=await client.from("auryn_validation_runs").select("id").eq("status","RUNNING").limit(50);
 let completed=0;
 for(const r of runs||[]){const {data:jobs}=await client.from("auryn_validation_jobs").select("status,metrics").eq("run_id",r.id);if(!jobs?.length)continue;const open=jobs.some((j:any)=>j.status==="PENDING"||j.status==="RUNNING");if(open)continue;const terminalFail=jobs.some((j:any)=>j.status==="FAILED");const processed=jobs.reduce((n:number,j:any)=>n+Number(j.metrics?.saved||0),0),failed=jobs.reduce((n:number,j:any)=>n+Number(j.metrics?.failed||0),0);await client.from("auryn_validation_runs").update({status:terminalFail?"FAIL":failed?"WATCH":"PASS",processed_symbols:processed,failed_symbols:failed,completed_at:now}).eq("id",r.id);completed++;}
 return NextResponse.json({status:"ok",staleRequeued:stale.data?.length||0,failedRequeued:retry.data?.length||0,runsCompleted:completed});
}
