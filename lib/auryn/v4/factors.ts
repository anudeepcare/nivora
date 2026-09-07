import type {CanonicalFactorKey,FactorAssessment,FactorObservation} from "./domain";
import type {MetricValidationState} from "../../v65/domain";
import type {AnalystModelDefinition} from "./model-registry";

export interface FactorEvaluation {
  assessments:Partial<Record<CanonicalFactorKey,FactorAssessment>>;
  coverage:number;
  missingRequired:CanonicalFactorKey[];
  weightedOverall:number|null;
  slowScore:number|null;
  opportunityScore:number|null;
  riskScore:number|null;
  validationState:MetricValidationState;
}

const rank:Record<MetricValidationState,number>={MEASURED:4,HEURISTIC:3,COLLECTING:2,UNAVAILABLE:1};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const usable=(x:FactorObservation)=>x.score!=null&&Number.isFinite(x.score)&&x.evidenceIds.length>0&&x.validationState!=="UNAVAILABLE";

function choose(observations:FactorObservation[],factor:CanonicalFactorKey){
  return observations.filter(x=>x.factor===factor&&usable(x)).sort((a,b)=>{
    const byState=rank[b.validationState]-rank[a.validationState];
    if(byState)return byState;
    return new Set(b.evidenceIds).size-new Set(a.evidenceIds).size;
  })[0];
}

function weightedAggregate(keys:readonly CanonicalFactorKey[],assessments:Partial<Record<CanonicalFactorKey,FactorAssessment>>){
  const parts=keys.map(k=>assessments[k]).filter((x):x is FactorAssessment=>Boolean(x?.available&&x.score!=null&&Number.isFinite(x.score)));
  const w=parts.reduce((s,x)=>s+x.weight,0);
  return w?parts.reduce((s,x)=>s+Number(x.score)*x.weight,0)/w:null;
}

export function evaluateV4Factors(observations:FactorObservation[],model:AnalystModelDefinition):FactorEvaluation{
  const assessments:Partial<Record<CanonicalFactorKey,FactorAssessment>>={};
  const keys=Object.keys(model.factorWeights) as CanonicalFactorKey[];
  for(const key of keys){
    const selected=choose(observations,key);
    const weight=model.factorWeights[key]??0;
    if(selected){
      assessments[key]={...selected,score:clamp(Number(selected.score)),weight,available:true};
    }
  }
  const totalWeight=Object.values(model.factorWeights).reduce((s,w)=>s+(w??0),0);
  const coveredWeight=Object.entries(model.factorWeights).reduce((s,[key,w])=>s+(assessments[key as CanonicalFactorKey]?.available?(w??0):0),0);
  const coverage=totalWeight?Math.round(coveredWeight/totalWeight*100):0;
  const missingRequired=model.requiredFactors.filter(key=>!assessments[key]?.available);
  const present=Object.values(assessments).filter(Boolean) as FactorAssessment[];
  let validationState:MetricValidationState;
  if(missingRequired.length)validationState="UNAVAILABLE";
  else if(present.some(x=>x.validationState==="HEURISTIC"))validationState="HEURISTIC";
  else if(present.some(x=>x.validationState==="COLLECTING"))validationState="COLLECTING";
  else validationState="MEASURED";

  const availableEntries=Object.entries(model.factorWeights).filter(([key])=>assessments[key as CanonicalFactorKey]?.available);
  const availableWeight=availableEntries.reduce((s,[,w])=>s+(w??0),0);
  const weightedOverall=availableWeight===0?null:availableEntries.reduce((s,[key,w])=>s+(assessments[key as CanonicalFactorKey]!.score??0)*(w??0),0)/availableWeight;
  const slowKeys=["BUSINESS_QUALITY","GROWTH_INFLECTION","MOAT","FUNDAMENTALS_EARNINGS"] as const;
  const opportunityKeys=["NARRATIVE_EXPECTATIONS","VALUATION","TECHNICALS","POSITIONING","CATALYSTS","SECTOR_INDUSTRY","MACRO_REGIME"] as const;
  const slowScore=weightedAggregate(slowKeys,assessments);
  const opportunityScore=weightedAggregate(opportunityKeys,assessments);
  const riskScore=assessments.RISK?.score??null;
  return{
    assessments,
    coverage,
    missingRequired,
    weightedOverall:weightedOverall==null?null:+weightedOverall.toFixed(2),
    slowScore:slowScore==null?null:+slowScore.toFixed(2),
    opportunityScore:opportunityScore==null?null:+opportunityScore.toFixed(2),
    riskScore:riskScore==null?null:+Number(riskScore).toFixed(2),
    validationState
  };
}
