import {ENGINE_VERSION,VALUATION_VERSION,WEIGHTS_VERSION,TODAY_POLICY_VERSION} from "@/lib/nivora-version";
import {freezeDecision} from "@/lib/nivora-snapshot";
import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(req:Request){
 try{
  const body=await req.json();const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({enabled:false,reason:"Validation persistence is not configured."});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const engineVersion=String(body.engineVersion||ENGINE_VERSION);
  const row={symbol:String(body.symbol||"").toUpperCase(),engine_version:engineVersion,mode:String(body.mode||"long"),price:Number(body.price||0),score:Number(body.score||0),confidence:Number(body.confidence||0),action:String(body.action||""),thesis_label:String(body.thesisLabel||""),factors:body.dimensions||{},levels:body.levels||{},evidence:body.evidence||{},audit_id:String(body.auditId||""),observed_at:new Date().toISOString()};
  const{error}=await db.from("nivora_validation_snapshots").insert(row);if(error)throw error;
  const d=body.investorDecision,symbol=row.symbol;
  if(d&&symbol){
    const{data:last}=await db.from("nivora_decision_history").select("observed_at,thesis_score,action").eq("symbol",symbol).eq("engine_version",engineVersion).order("observed_at",{ascending:false}).limit(1).maybeSingle();
    const now=new Date(),sameDay=last?.observed_at&&new Date(last.observed_at).toISOString().slice(0,10)===now.toISOString().slice(0,10),material=!last||String(last.action)!==String(d.action)||Math.abs(Number(last.thesis_score||0)-Number(d.thesisScore||0))>=5;
    if(!sameDay||material){
      const hz=new Map((d.horizons||[]).map((h:any)=>[h.key,Number(h.score)]));const f=d.factors||{};
      await db.from("nivora_decision_history").insert({symbol,observed_at:now.toISOString(),price:Number(body.price||0),company_score:Number(d.companyScore||0),growth_score:f.growth==null?null:Number(f.growth),financial_score:f.financial==null?null:Number(f.financial),analyst_score:f.streetChange==null?null:Number(f.streetChange),valuation_score:f.valuation==null?null:Number(f.valuation),thesis_score:Number(d.thesisScore||0),opportunity_score:Number(d.opportunityScore||0),evidence_confidence:Number(d.dataCompleteness||d.confidence||0),thesis_label:String(d.thesisLabel||""),thesis_state:String(d.thesisState||""),action:String(d.action||""),horizon_3m:hz.get("3M")??null,horizon_6m:hz.get("6M")??null,horizon_1y:hz.get("1Y")??null,horizon_2y:hz.get("2Y")??null,horizon_3y:hz.get("3Y")??null,reason:(d.drivers||[])[0]||null,main_risk:(d.risks||[])[0]||null,engine_version:engineVersion,weights_version:WEIGHTS_VERSION,valuation_version:VALUATION_VERSION,archetype:d.archetype||null,benchmark_symbol:String(body?.evidence?.benchmark||"SPY"),source_snapshot:{factors:f,dataCompleteness:d.dataCompleteness,decisionGradeEvidence:d.decisionGradeEvidence??null,today:d.today||null,todayPolicyVersion:TODAY_POLICY_VERSION,levels:body.levels||{},auditId:body.auditId||null,benchmarkPrice:body?.evidence?.benchmarkPrice??null}});
      const frozen=freezeDecision({symbol,observedAt:now.toISOString(),price:Number(body.price||0),decision:d,evidence:{...(body.evidence||{}),levels:body.levels||{},auditId:body.auditId||null},benchmarkSymbol:String(body?.evidence?.benchmark||"SPY"),sectorBenchmarkSymbol:body?.evidence?.sectorBenchmark||null});
      await Promise.resolve(db.from("nivora_v59_decision_snapshots").insert({symbol,observed_at:frozen.observedAt,price:frozen.price,engine_version:frozen.engineVersion,weights_version:frozen.weightsVersion,valuation_version:frozen.valuationVersion,today_policy_version:frozen.todayPolicyVersion,evidence_fingerprint:frozen.evidenceFingerprint,benchmark_symbol:frozen.benchmarkSymbol,sector_benchmark_symbol:frozen.sectorBenchmarkSymbol,decision:frozen.decision,evidence:frozen.evidence})).then(()=>undefined).catch(()=>undefined);
    }
  }
  return NextResponse.json({enabled:true,saved:true,engineVersion});
 }catch(e:any){return NextResponse.json({enabled:false,error:e?.message||"Validation snapshot failed"},{status:500})}
}
