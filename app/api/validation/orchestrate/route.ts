import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {chunkSymbols,jobIdempotencyKey,type ValidationRunKind} from "@/lib/auryn/v99/jobs";
export const dynamic="force-dynamic";export const runtime="nodejs";
function authorized(req:Request){const s=process.env.CRON_SECRET;return Boolean(s)&&req.headers.get("authorization")===`Bearer ${s}`}
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}

function centralParts(now=new Date()){const f=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false});const o=Object.fromEntries(f.formatToParts(now).map(p=>[p.type,p.value]));return{weekday:o.weekday,hour:Number(o.hour),minute:Number(o.minute)}}
function allowed(kind:ValidationRunKind,force:boolean){if(force)return true;const x=centralParts();if(kind==="PREMARKET")return ["Mon","Tue","Wed","Thu","Fri"].includes(x.weekday)&&x.hour===7&&x.minute<=45;if(kind==="DAILY_CLOSE")return ["Mon","Tue","Wed","Thu","Fri"].includes(x.weekday)&&x.hour===15&&x.minute>=10&&x.minute<=50;if(kind==="AFTER_HOURS")return ["Mon","Tue","Wed","Thu","Fri"].includes(x.weekday)&&x.hour===18;if(kind==="NIGHTLY")return x.hour===23;return x.weekday==="Sat"&&x.hour===9}
export async function GET(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const client=db();if(!client)return NextResponse.json({error:"Supabase service configuration missing"},{status:503});
 const u=new URL(req.url),kind=String(u.searchParams.get("kind")||"DAILY_CLOSE").toUpperCase() as ValidationRunKind,force=u.searchParams.get("force")==="1";
 if(!["PREMARKET","DAILY_CLOSE","AFTER_HOURS","NIGHTLY","WEEKLY"].includes(kind))return NextResponse.json({error:"Invalid run kind"},{status:400});
 if(!allowed(kind,force))return NextResponse.json({status:"skipped",reason:"Outside guarded America/Chicago schedule window",kind});
 const evaluationDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 let {data:universe}=await client.from("auryn_validation_universe").select("symbol,priority").eq("active",true).order("priority").order("symbol").limit(300);
 if((universe||[]).length<250){
   const {data:fallback}=await client.from("nivora_market_universe").select("symbol").eq("active",true).order("symbol").limit(300);
   if(fallback?.length){await client.from("auryn_validation_universe").upsert(fallback.map((x:any)=>({symbol:String(x.symbol).toUpperCase(),source:"nivora_market_universe"})),{onConflict:"symbol",ignoreDuplicates:true});universe=fallback as any;}
 }
 const symbols=[...new Set((universe||[]).map((x:any)=>String(x.symbol||"").toUpperCase()).filter(Boolean))].slice(0,300);
 if(!symbols.length)return NextResponse.json({error:"Validation universe is empty"},{status:503});
 const modelVersion="auryn-v9.8";
 const {data:run,error:runErr}=await client.from("auryn_validation_runs").upsert({run_kind:kind,evaluation_date:evaluationDate,model_version:modelVersion,status:"RUNNING",expected_symbols:symbols.length,started_at:new Date().toISOString()},{onConflict:"run_kind,evaluation_date,model_version"}).select("id,status").single();
 if(runErr||!run)return NextResponse.json({error:runErr?.message||"Unable to create run"},{status:500});
 const batches=chunkSymbols(symbols,8);
 const rows=batches.map((batch,i)=>({run_id:run.id,idempotency_key:jobIdempotencyKey(kind,evaluationDate,i),job_kind:"SHADOW_CAPTURE",batch_no:i,symbols:batch,status:"PENDING"}));
 const {error:jobErr}=await client.from("auryn_validation_jobs").upsert(rows,{onConflict:"idempotency_key",ignoreDuplicates:true});
 if(jobErr)return NextResponse.json({error:jobErr.message},{status:500});
 return NextResponse.json({status:"queued",runId:run.id,kind,evaluationDate,symbols:symbols.length,batches:batches.length,backgroundBudgetPerMinute:42});
}
