import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {loadAurynCanonicalSnapshot} from "@/lib/auryn/v935/canonical";
import {fingerprintShadowSnapshot,OUTCOME_HORIZONS,outcomeDueAt} from "@/lib/auryn/v99/shadow-cio";
import {callsNeededForBatch} from "@/lib/auryn/v99/rate-budget";
import {retryDelaySeconds} from "@/lib/auryn/v99/jobs";
import {assertShadowDecisionReady} from "@/lib/auryn/v991/shadow-mapping";
import {runAutonomousCanonicalResearch} from "@/lib/auryn/v995/autonomous-research";
import {persistAutonomousResearch} from "@/lib/auryn/v995/persist-research";
export const dynamic="force-dynamic";export const runtime="nodejs";
function authorized(req:Request){const s=process.env.CRON_SECRET;return Boolean(s)&&req.headers.get("authorization")===`Bearer ${s}`}
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}

const priceOf=(s:any)=>{const vals=[s?.market?.decisionPrice,s?.market?.displayPrice,s?.market?.regularClosePrice,s?.market?.regularClose];for(const x of vals){const n=Number(x);if(Number.isFinite(n)&&n>0)return n}return null};
export async function GET(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const client=db();if(!client)return NextResponse.json({error:"Supabase service configuration missing"},{status:503});
 const {data:leased,error:leaseErr}=await client.rpc("auryn_lease_validation_job",{lease_seconds:180});
 if(leaseErr)return NextResponse.json({error:leaseErr.message},{status:500});
 const job=Array.isArray(leased)?leased[0]:leased;if(!job)return NextResponse.json({status:"idle"});
 const symbols=(job.symbols||[]).map((x:any)=>String(x).toUpperCase()).filter(Boolean);
 const tokens=callsNeededForBatch(symbols.length,8);
 const {data:budget,error:budgetErr}=await client.rpc("auryn_acquire_provider_tokens",{requested:tokens,background_limit:42});
 if(budgetErr||budget!==true){
   await client.from("auryn_validation_jobs").update({status:"PENDING",available_at:new Date(Date.now()+60_000).toISOString(),leased_at:null,lease_expires_at:null}).eq("id",job.id);
   return NextResponse.json({status:"deferred",reason:"background provider budget unavailable",tokens});
 }
 const {data:run}=await client.from("auryn_validation_runs").select("run_kind,evaluation_date,model_version").eq("id",job.run_id).single();
 if(!run){await client.from("auryn_validation_jobs").update({status:"FAILED",error:"RUN_NOT_FOUND"}).eq("id",job.id);return NextResponse.json({error:"Run not found"},{status:500});}
 let saved=0;const failures:any[]=[];
 for(const symbol of symbols){
   try{
     let snap:any=await loadAurynCanonicalSnapshot(symbol);
     if(String(snap?.research?.state||"")==="ANALYSIS_REQUIRED"){
       const generated=await runAutonomousCanonicalResearch(symbol,{origin:new URL(req.url).origin});
       if(generated.state==="TEMPORARY_PROVIDER_FAILURE")throw new Error(`TEMPORARY_PROVIDER_FAILURE:${generated.reason}`);
       if(generated.state!=="RESEARCH_READY")throw new Error(`INSUFFICIENT_EVIDENCE:${generated.reason}`);
       await persistAutonomousResearch(client,symbol,generated);
       snap=await loadAurynCanonicalSnapshot(symbol);
     }
     const price=priceOf(snap),market=snap?.market||{};
     const decision=assertShadowDecisionReady(snap);
     if(price==null)throw new Error("CANONICAL_MARKET_PRICE_NOT_READY");
     const input={modelVersion:run.model_version,symbol,evaluationDate:run.evaluation_date,runKind:run.run_kind,marketPrice:price,decision,evidenceFingerprint:decision.evidenceFingerprint};
     const fp=fingerprintShadowSnapshot(input);
     const row={run_id:job.run_id,model_version:run.model_version,symbol,evaluation_date:run.evaluation_date,run_kind:run.run_kind,observed_at:new Date().toISOString(),market_price:price,new_money_action:decision.newMoney,owner_action:decision.owner,long_term_action:decision.longTerm,decision_score:decision.decisionScore,evidence_completeness:decision.evidenceCompleteness,setup_state:decision.setupState,market_state:market?.priceState??market?.session??null,bear_value:null,base_value:null,bull_value:null,snapshot_fingerprint:fp,evidence_fingerprint:input.evidenceFingerprint,canonical_snapshot:snap};
     let {data:inserted,error}=await client.from("auryn_shadow_snapshots").insert(row).select("id").single();
     if(error&&String(error.code)!=="23505")throw error;
     if(!inserted){const x=await client.from("auryn_shadow_snapshots").select("id").eq("model_version",run.model_version).eq("symbol",symbol).eq("evaluation_date",run.evaluation_date).eq("run_kind",run.run_kind).maybeSingle();inserted=x.data as any;}
     if(inserted?.id){
       const outcomes=OUTCOME_HORIZONS.map(h=>({snapshot_id:inserted.id,horizon:h,due_date:outcomeDueAt(run.evaluation_date,h),status:"PENDING"}));
       await client.from("auryn_shadow_outcomes").upsert(outcomes,{onConflict:"snapshot_id,horizon",ignoreDuplicates:true});
     }
     saved++;
   }catch(e:any){failures.push({symbol,error:String(e?.message||e).slice(0,300)})}
 }
 if(failures.length){
   const attempt=Number(job.attempt||1),terminal=attempt>=Number(job.max_attempts||5);
   await client.from("auryn_validation_jobs").update({status:terminal?"FAILED":"PENDING",available_at:new Date(Date.now()+retryDelaySeconds(attempt)*1000).toISOString(),leased_at:null,lease_expires_at:null,error:JSON.stringify(failures),metrics:{saved,failed:failures.length}}).eq("id",job.id);
 }else await client.from("auryn_validation_jobs").update({status:"DONE",completed_at:new Date().toISOString(),lease_expires_at:null,metrics:{saved,failed:0}}).eq("id",job.id);
 return NextResponse.json({status:failures.length?"partial":"done",jobId:job.id,saved,failed:failures.length,failures});
}
