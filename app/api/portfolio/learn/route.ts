import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {buildInvestorDecision} from "@/lib/nivora-investor";
import {freezeDecision} from "@/lib/nivora-snapshot";
import {ENGINE_VERSION} from "@/lib/nivora-version";

export const dynamic="force-dynamic";
function auth(req:Request){const secret=process.env.TRADING_LAB_CRON_SECRET||process.env.CRON_SECRET;return Boolean(secret&&req.headers.get("authorization")===`Bearer ${secret}`)}
async function json(url:string){const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(12000)}),x=await r.json();if(!r.ok||x?.error)throw new Error(x?.error||`${r.status} ${url}`);return x}

export async function GET(req:Request){
 if(!auth(req))return NextResponse.json({error:"Unauthorized."},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({status:"unavailable",reason:"Supabase service credentials are required."},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:positions,error}=await db.from("portfolio_positions").select("symbol,asset_type,updated_at").neq("asset_type","CASH").order("updated_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({status:"error",error:error.message},{status:500});
 const symbols=[...new Set((positions||[]).filter((x:any)=>String(x.asset_type||"EQUITY")==="EQUITY").map((x:any)=>String(x.symbol||"").toUpperCase()).filter(Boolean))].slice(0,24);
 const origin=new URL(req.url).origin;
 const results:any[]=[];
 for(const symbol of symbols){
  try{
   const [market,company,context]=await Promise.all([
    json(`${origin}/api/analyze/${encodeURIComponent(symbol)}`),
    json(`${origin}/api/company/${encodeURIComponent(symbol)}`),
    json(`${origin}/api/context/${encodeURIComponent(symbol)}`)
   ]);
   const decision=buildInvestorDecision({market,company,context,owns:false});
   if(!decision){
    results.push({symbol,status:"ERROR",error:"Investor decision unavailable"});
    continue;
   }
   const observedAt=new Date().toISOString();
   const evidence={source:"V65_PORTFOLIO_LEARNING",marketDataIntegrity:market?.dataIntegrity||null,benchmark:market?.market?.benchmark||"SPY",levels:market?.levels||null,companyEvidenceAsOf:company?.asOf||company?.updatedAt||null,contextEvidenceAsOf:context?.asOf||context?.updatedAt||null};
   const frozen=freezeDecision({symbol,observedAt,price:Number(market.price||0),decision,evidence,benchmarkSymbol:String(market?.market?.benchmark||"SPY"),sectorBenchmarkSymbol:null});
   const {data:last}=await db.from("nivora_v59_decision_snapshots").select("evidence_fingerprint").eq("engine_version",ENGINE_VERSION).eq("symbol",symbol).order("observed_at",{ascending:false}).limit(1).maybeSingle();
   if(last?.evidence_fingerprint===frozen.evidenceFingerprint){results.push({symbol,status:"UNCHANGED"});continue}
   const {error:ie}=await db.from("nivora_v59_decision_snapshots").insert({symbol,observed_at:frozen.observedAt,price:frozen.price,engine_version:frozen.engineVersion,weights_version:frozen.weightsVersion,valuation_version:frozen.valuationVersion,today_policy_version:frozen.todayPolicyVersion,evidence_fingerprint:frozen.evidenceFingerprint,benchmark_symbol:frozen.benchmarkSymbol,sector_benchmark_symbol:frozen.sectorBenchmarkSymbol,decision:frozen.decision,evidence:frozen.evidence});
   if(ie)throw ie;
   results.push({symbol,status:"SNAPSHOT",today:decision.today?.action||decision.action,thesisScore:decision.thesisScore,timingScore:decision.timing?.score});
  }catch(e:any){results.push({symbol,status:"ERROR",error:e?.message||String(e)})}
 }
 return NextResponse.json({status:"ok",engineVersion:ENGINE_VERSION,universe:"portfolio equities",requested:symbols.length,snapshots:results.filter(x=>x.status==="SNAPSHOT").length,unchanged:results.filter(x=>x.status==="UNCHANGED").length,errors:results.filter(x=>x.status==="ERROR").length,results,note:"Portfolio learning records frozen evidence for validation. It never mutates V65 production weights."},{headers:{"Cache-Control":"private, no-store"}});
}
