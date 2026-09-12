import {buildInvestorDecision} from "../../nivora-investor";
import {adaptCurrentEvidenceToV4} from "../v4/current-evidence-adapter";
import {buildAurynV4CoreAnalysis} from "../v4/analyze";
import {buildAurynV5Analysis} from "../v5/analyze";
import {buildDecisionSnapshot} from "../v931/decision-snapshot";
import {buildInstitutionalDecisionKernel} from "../v931/decision-kernel";
import {deriveV934DecisionTechnical} from "../v934/decision-bridge";
import {classifyResearchFailure,validateResearchDecision} from "./research-contract";

const finite=(x:any)=>x!==null&&x!==undefined&&Number.isFinite(Number(x));
async function get(fetcher:typeof fetch,origin:string,path:string){
 const r=await fetcher(`${origin}${path}`,{cache:"no-store",headers:{"x-auryn-background-research":"1"}});
 let j:any=null;try{j=await r.json()}catch{}
 if(!r.ok||j?.error){const e:any=new Error(j?.error||`HTTP_${r.status}`);e.status=r.status;e.code=j?.code;throw e}return j;
}
export async function runAutonomousCanonicalResearch(symbolRaw:string,{origin,fetcher=fetch}:{origin:string;fetcher?:typeof fetch}){
 const symbol=symbolRaw.toUpperCase();
 try{
  const [d,company,context,institutional]=await Promise.all([
   get(fetcher,origin,`/api/analyze/${encodeURIComponent(symbol)}`),get(fetcher,origin,`/api/company/${encodeURIComponent(symbol)}`),
   get(fetcher,origin,`/api/context/${encodeURIComponent(symbol)}`),get(fetcher,origin,`/api/institutional/${encodeURIComponent(symbol)}`)
  ]);
  const marketTruth=d?.marketTruth;if(!marketTruth?.snapshotId)return{state:"INSUFFICIENT_EVIDENCE" as const,reason:"MARKET_TRUTH_MISSING"};
  const px=Number(marketTruth.decisionPrice),market=finite(px)?{...d,price:px,canonicalMarketSnapshot:marketTruth}:{...d,canonicalMarketSnapshot:marketTruth};
  const legacy=buildInvestorDecision({market,company,context,institutional,owns:false,position:null});
  const v4=buildAurynV4CoreAnalysis(adaptCurrentEvidenceToV4({symbol,asOf:marketTruth.asOf||new Date().toISOString(),market,company,context,institutional,legacyDecision:legacy}));
  const v5=buildAurynV5Analysis({symbol,marketTruth,v4,technical:market?.technicalState&&market?.indicators?market:null,bars:Array.isArray(market?.candles)?market.candles:[]});
  const metricEvidence=Object.fromEntries(v5.metrics.map((m:any)=>[m.id,{value:m.value,state:m.state,available:m.available,source:m.source,timeframe:m.timeframe??null}]));
  const snap=buildDecisionSnapshot({symbol,asOf:marketTruth.asOf,marketTruth,completedDailyBarCutoff:d?.analysisAnchorAsOf??null,fundamentalsAsOf:company?.asOf??company?.updatedAt??null,earningsAsOf:context?.earnings?.date??null,estimatesAsOf:context?.estimatesAsOf??null,newsCutoff:context?.asOf??null,macroAsOf:d?.analysisAnchorAsOf??null,featureVersion:String(d?.indicatorVersion||"wilder-v1"),modelVersion:String(v5.engineVersion),policyVersion:"auryn-v9.3.1",evidence:metricEvidence});
  const metric=(id:string)=>v5.metrics.find((x:any)=>x.id===id),mv=(id:string)=>{const m=metric(id),n=Number(m?.value);return m?.available&&Number.isFinite(n)?n:null};
  const why=(id:string,label:string)=>{const m:any=metric(id);return m?.available&&finite(m.value)?`${label} is ${Math.round(Number(m.value))}/100. ${String(m.interpretation||"Verified canonical evidence is available.")}`:`${label} is unavailable; AURYN withholds this pillar.`};
  const tech=v5.technical,ts=tech?.technicalState,res=Number(tech?.levels?.resistance),inv=Number(tech?.levels?.invalidation),v934=d?.marketIntelligence?deriveV934DecisionTechnical(d.marketIntelligence):null;
  const ctx=["catalysts","macro","sector"].map(metric).filter((m:any)=>m?.available&&finite(m.value)),ctxScores=ctx.map((m:any)=>Number(m.value)),risk=mv("riskPressure");
  const structure=v934?.marketStructureScore??ts?.strength??null,available=[mv("businessQuality"),mv("fundamentals"),mv("valuation"),structure,ctxScores.length?ctxScores.reduce((a,b)=>a+b,0)/ctxScores.length:null,risk==null?null:100-risk].filter(x=>x!=null).length;
  const decision=buildInstitutionalDecisionKernel({snapshotId:snap.snapshotId,symbol,marketPrice:Number.isFinite(px)?px:null,executionTradable:Boolean(marketTruth.executionTradable),previousSetupState:null,scores:{business:mv("businessQuality"),earningsRevisions:mv("fundamentals"),valuation:mv("valuation"),marketStructure:structure,catalystsRegime:ctxScores.length?ctxScores.reduce((a,b)=>a+b,0)/ctxScores.length:null,riskAsymmetry:risk==null?null:100-risk},pillarEvidence:{business:{why:why("businessQuality","Business quality"),evidenceIds:["metric.businessQuality"],asOf:company?.asOf??company?.updatedAt??null},earningsRevisions:{why:why("fundamentals","Earnings and forward-fundamental evidence"),evidenceIds:["metric.fundamentals"],asOf:context?.estimatesAsOf??context?.earnings?.date??null},valuation:{why:why("valuation","Valuation and expected-return evidence"),evidenceIds:["metric.valuation"],asOf:company?.asOf??company?.updatedAt??null},marketStructure:{why:v934?.why??"Completed daily-bar market structure.",evidenceIds:["metric.technicalStrength"],asOf:d?.analysisAnchorAsOf??null},catalystsRegime:{why:ctx.length?ctx.map((m:any)=>`${m.label} ${Math.round(Number(m.value))}/100`).join(" "):"Catalyst, sector and macro context are incomplete; AURYN withholds this pillar.",evidenceIds:ctx.map((m:any)=>`metric.${m.id}`),asOf:context?.asOf??d?.analysisAnchorAsOf??null},riskAsymmetry:{why:risk==null?"Verified risk-pressure evidence is unavailable.":why("riskPressure","Risk pressure"),evidenceIds:["metric.riskPressure"],asOf:d?.analysisAnchorAsOf??null}},technical:v934?{trend:v934.trend,momentum:v934.momentum,flow:v934.flow,structure:v934.structure,nearResistance:v934.nearResistance,confirmedBreakout:v934.confirmedBreakout,structuralBreak:v934.structuralBreak,reclaimLevel:v934.reclaimLevel,invalidation:v934.invalidation}:{trend:ts?.trend??50,momentum:ts?.momentum??50,flow:ts?.participation??50,structure:ts?.structure??50,nearResistance:Number.isFinite(px)&&Number.isFinite(res)?px>=res*.94&&px<=res*1.03:false,confirmedBreakout:Number.isFinite(px)&&Number.isFinite(res)?px>res&&(ts?.participation??0)>=60:false,structuralBreak:Number.isFinite(px)&&Number.isFinite(inv)?px<inv:false,reclaimLevel:Number.isFinite(res)?res:null,invalidation:Number.isFinite(inv)?inv:null},evidenceCompleteness:Math.round(available/6*100),canonicalAction:v5.decision.primaryAction,canonicalOwnerAction:v5.decision.ownerAction});
  if(!validateResearchDecision(decision))return{state:"INSUFFICIENT_EVIDENCE" as const,reason:"CANONICAL_DECISION_INCOMPLETE"};
  return{state:"RESEARCH_READY" as const,decision,marketTruth,marketIntelligence:d?.marketIntelligence??null};
 }catch(e:any){return{state:classifyResearchFailure(e),reason:String(e?.code||e?.message||e)}}
}
