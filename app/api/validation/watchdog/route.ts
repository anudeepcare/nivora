import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";export const runtime="nodejs";
function authorized(req:Request){const s=process.env.CRON_SECRET;return Boolean(s)&&req.headers.get("authorization")===`Bearer ${s}`}
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}

export async function GET(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});const client=db();if(!client)return NextResponse.json({error:"Supabase service configuration missing"},{status:503});
 const now=new Date().toISOString();
 const stale=await client.from("auryn_validation_jobs").update({status:"PENDING",leased_at:null,lease_expires_at:null,available_at:now,error:"LEASE_EXPIRED_RETRY"}).eq("status","RUNNING").lt("lease_expires_at",now).select("id");
 const retry=await client.from("auryn_validation_jobs").update({status:"PENDING",available_at:now}).eq("status","FAILED").lt("attempt",5).neq("error","RUN_NOT_FOUND").select("id");
 const completed=0;
 return NextResponse.json({status:"ok",staleRequeued:stale.data?.length||0,failedRequeued:retry.data?.length||0,runsCompleted:completed});
}
