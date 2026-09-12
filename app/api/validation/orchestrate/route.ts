import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {chunkSymbols,type ValidationRunKind} from "@/lib/auryn/v99/jobs";
import {buildExchangeStratifiedUniverse} from "@/lib/auryn/v994/universe-schema";
import {canResumeRun,nextRunAttempt,runIdentityKey,jobAttemptIdempotencyKey} from "@/lib/auryn/v992/run-lifecycle";
import {loadValidationUniversePages} from "@/lib/auryn/v993/universe-loader";
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
 let sourceUniverse:any[]=[];
 try{sourceUniverse=await loadValidationUniversePages(client,6000,1000)}catch(e:any){return NextResponse.json({error:`Validation universe source unavailable: ${String(e?.message||e)}`},{status:503})}
 const symbols=buildExchangeStratifiedUniverse(sourceUniverse.map((x:any)=>({symbol:String(x.symbol||"").toUpperCase(),name:x.name??null,exchange:x.exchange??null,instrument_type:x.instrument_type??null,currency:x.currency??null,country:x.country??null})),300);
 if(symbols.length<250)return NextResponse.json({error:`Validation universe too small after eligibility filters (${symbols.length})`},{status:503});
 await client.from("auryn_validation_universe").update({active:false}).eq("active",true);
 await client.from("auryn_validation_universe").upsert(symbols.map((symbol,i)=>({symbol,active:true,priority:i+1,source:"v9.9.4-exchange-stratified"})),{onConflict:"symbol"});
 if(!symbols.length)return NextResponse.json({error:"Validation universe is empty"},{status:503});
 const modelVersion="auryn-v9.8";
 const {data:priorRuns,error:priorErr}=await client.from("auryn_validation_runs").select("id,status,attempt,run_identity").eq("run_kind",kind).eq("evaluation_date",evaluationDate).eq("model_version",modelVersion).order("attempt",{ascending:false});
 if(priorErr)return NextResponse.json({error:priorErr.message},{status:500});
 const resumable=(priorRuns||[]).find((r:any)=>canResumeRun(String(r.status)));
 let run:any=resumable||null,attempt=Number(resumable?.attempt||0);
 if(!run){
   attempt=nextRunAttempt(priorRuns||[]);
   const identity=runIdentityKey(kind,evaluationDate,modelVersion,attempt);
   const created=await client.from("auryn_validation_runs").insert({run_kind:kind,evaluation_date:evaluationDate,model_version:modelVersion,status:"RUNNING",expected_symbols:symbols.length,started_at:new Date().toISOString(),attempt,run_identity:identity}).select("id,status,attempt,run_identity").single();
   if(created.error||!created.data)return NextResponse.json({error:created.error?.message||"Unable to create immutable validation run"},{status:500});
   run=created.data;
 }
 const batches=chunkSymbols(symbols,8);
 const rows=batches.map((batch,i)=>({run_id:run.id,idempotency_key:jobAttemptIdempotencyKey(kind,evaluationDate,modelVersion,attempt,i),job_kind:"SHADOW_CAPTURE",batch_no:i,symbols:batch,status:"PENDING"}));
 const {error:jobErr}=await client.from("auryn_validation_jobs").upsert(rows,{onConflict:"idempotency_key",ignoreDuplicates:true});
 if(jobErr)return NextResponse.json({error:jobErr.message},{status:500});
 return NextResponse.json({status:"queued",runId:run.id,attempt,runIdentity:run.run_identity??runIdentityKey(kind,evaluationDate,modelVersion,attempt),resumed:Boolean(resumable),kind,evaluationDate,symbols:symbols.length,batches:batches.length,backgroundBudgetPerMinute:42});
}
