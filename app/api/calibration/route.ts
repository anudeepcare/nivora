import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {ENGINE_VERSION,WEIGHTS_VERSION} from "@/lib/nivora-version";
import {summarizeCalibration} from "@/lib/nivora-calibration-v62";
import {summarizeCalibrationCohorts,type CalibrationRegime} from "@/lib/nivora-calibration-v63";
export const dynamic="force-dynamic";

const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
function wilson(w:number,n:number){if(!n)return null;const z=1.96,p=w/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return{lowPct:+((c-m)*100).toFixed(1),highPct:+((c+m)*100).toFixed(1)}}
function regime(benchmarkReturn:any):CalibrationRegime{const x=Number(benchmarkReturn);if(!Number.isFinite(x))return"UNKNOWN";return x>=4?"RISK_ON":x<=-4?"RISK_OFF":"NEUTRAL"}
function horizonLabel(days:number){return days===365?"1Y":days===730?"2Y":`${days}D`}

export async function GET(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({status:"unavailable",reason:"Calibration storage is not configured."});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const q=new URL(req.url).searchParams,engine=q.get("engine")||ENGINE_VERSION;
 const [{data:h},{data:o}]=await Promise.all([
  db.from("nivora_decision_history").select("id,thesis_score,action,archetype,engine_version,weights_version").eq("weights_version",WEIGHTS_VERSION).limit(50000),
  db.from("nivora_decision_outcomes").select("history_id,horizon_days,return_pct,benchmark_return_pct,excess_return_pct").limit(200000)
 ]);
 const history=new Map((h||[]).map((x:any)=>[Number(x.id),x])),result:any={},cohortRows:any[]=[];
 for(const days of [30,90,180,365,730]){
  const rows=(o||[]).filter((x:any)=>Number(x.horizon_days)===days&&history.has(Number(x.history_id)));
  const buckets=new Map<string,{n:number,w:number,sum:number,alphaN:number}>();
  for(const x of rows){
   const hh:any=history.get(Number(x.history_id)),s=Number(hh?.thesis_score||0),score=`${Math.floor(clamp(s)/10)*10}-${Math.min(100,Math.floor(clamp(s)/10)*10+9)}`,arch=hh?.archetype||"unknown",k=`${arch}|${score}`,b=buckets.get(k)||{n:0,w:0,sum:0,alphaN:0};
   const raw=Number(x.return_pct||0),ex=Number.isFinite(Number(x.excess_return_pct))?Number(x.excess_return_pct):Number.isFinite(Number(x.benchmark_return_pct))?raw-Number(x.benchmark_return_pct):NaN;
   b.n++;if(Number.isFinite(ex)){b.w+=ex>0?1:0;b.sum+=ex;b.alphaN++}buckets.set(k,b)
  }
  const compatible:any[]=[];const exact:any[]=[];
  for(const x of rows){const hh:any=history.get(Number(x.history_id));const ex=Number.isFinite(Number(x.excess_return_pct))?Number(x.excess_return_pct):Number.isFinite(Number(x.benchmark_return_pct))?Number(x.return_pct||0)-Number(x.benchmark_return_pct):NaN;if(!Number.isFinite(ex))continue;const row={score:Number(hh?.thesis_score||0),alphaPct:ex,archetype:hh?.archetype||"unknown"};compatible.push(row);cohortRows.push({...row,horizon:horizonLabel(days),regime:regime(x.benchmark_return_pct)});if(hh?.engine_version===engine)exact.push(row)}
  result[days]={
   n:rows.length,
   compatibleSummary:summarizeCalibration(compatible,100),
   exactEngineSummary:summarizeCalibration(exact,30),
   buckets:[...buckets.entries()].map(([k,b])=>{const[archetype,score]=k.split("|");return{archetype,score,n:b.n,benchmarkComparableN:b.alphaN,alphaHitRatePct:b.alphaN?+(b.w/b.alphaN*100).toFixed(1):null,avgExcessReturnPct:b.alphaN?+(b.sum/b.alphaN).toFixed(2):null,confidence95:wilson(b.w,b.alphaN)}})
  };
 }
 // V65 exact-engine evidence comes from immutable Arena snapshots/outcomes.
 const {data:arenaSnaps}=await db.from("nivora_v59_decision_snapshots").select("id,decision").eq("engine_version",engine).order("observed_at",{ascending:false}).limit(2000);
 const arenaMap=new Map((arenaSnaps||[]).map((x:any)=>[Number(x.id),x]));
 const arenaIds=[...arenaMap.keys()],arenaOutcomes:any[]=[];
 for(let i=0;i<arenaIds.length;i+=200){const{data:xs}=await db.from("nivora_v59_arena_outcomes").select("snapshot_id,horizon,alpha_pct,benchmark_return_pct").in("snapshot_id",arenaIds.slice(i,i+200));arenaOutcomes.push(...(xs||[]))}
 const labelToDays:any={"30D":30,"90D":90,"180D":180,"1Y":365,"2Y":730};
 for(const [label,days] of Object.entries(labelToDays)){
  const exactRows=arenaOutcomes.filter((x:any)=>x.horizon===label).map((x:any)=>{const d:any=arenaMap.get(Number(x.snapshot_id))?.decision||{};return{score:Number(d.thesisScore||0),alphaPct:Number(x.alpha_pct||0),archetype:d.archetype||"unknown"}}).filter((x:any)=>Number.isFinite(x.alphaPct));
  if(result[days])result[days].exactEngineSummary=summarizeCalibration(exactRows,30);
 }
 const arenaMaturedN=arenaOutcomes.length;
 const summary90=result[90]?.compatibleSummary||summarizeCalibration([],100);
 const exact90=result[90]?.exactEngineSummary||summarizeCalibration([],30);
 const cohorts=summarizeCalibrationCohorts(cohortRows,30);
 return NextResponse.json({
  status:exact90.status==="CALIBRATED"?"calibrated":arenaMaturedN>0?"forward-validating":"collecting",
  engineVersion:engine,
  weightsVersion:WEIGHTS_VERSION,
  calibrationScope:"WEIGHTS_COMPATIBLE",
  modelConfidence:exact90.status==="CALIBRATED"?"Exact-engine calibrated":"Uncalibrated",
  summary:{scope:"Weight-compatible history",...summary90},
  exactEngineSummary90:exact90,
  learning:{state:arenaMaturedN>0?"LEARNING":"NOT_LEARNING_YET",maturedOutcomes:arenaMaturedN,productionFrozen:true,reason:arenaMaturedN>0?`${arenaMaturedN} exact-engine Arena outcomes have matured. They update evidence, not production weights.`:"No exact-engine Arena outcomes have matured yet."},
  champion:{engineVersion:engine,weightsVersion:WEIGHTS_VERSION,state:"FROZEN",note:"Production coefficients are immutable for this engine version."},
  challenger:{state:arenaMaturedN>=30?"ELIGIBLE_FOR_EVALUATION":"COLLECTING",minimumForwardOutcomes:30,currentForwardOutcomes:arenaMaturedN,autoPromote:false,note:"A challenger can be evaluated after sufficient evidence, but promotion always creates a new engine version."},
  note:"Calibration reuses historical decisions only when they share the same thesis-weight contract. Exact-engine results are also shown separately. This is evidence, not a promise of future performance.",
  outcomes:result,
  cohorts,
  cohortPolicy:"Cohorts are segmented by archetype × horizon × benchmark regime. Regime is derived from the benchmark return over the matured outcome window: >= +4% risk-on, <= -4% risk-off, otherwise neutral."
 },{headers:{"Cache-Control":"private, no-store, max-age=0"}})
}
