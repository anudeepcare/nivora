import type {FeatureCandidate} from '../v9/domain';
import {benjaminiHochberg} from '../v9/statistics';
import type {V93FeatureMetric,V93Policy,V93TournamentResult} from './domain';
import {assessV93Promotion,dispositionFor} from './promotion';

function emptyMetric(id:string,horizon:string|null):V93FeatureMetric{
  return{featureId:id,horizon,totalN:0,trainN:0,oosN:0,validFoldCount:0,folds:[],oosAvgEdgePct:null,costStressOosAvgEdgePct:null,oosConfidence95:{mean:0,low:0,high:0,iterations:0},oosInformationCoefficient:null,oosHitRatePct:null,avgMaxDrawdownPct:null,positiveFoldPct:null,regimesCovered:0,regimePositivePct:null,archetypesCovered:0,archetypePositivePct:null,sectorsCovered:0,sectorPositivePct:null,pValue:1};
}

export function finalizeV93Tournament(catalog:FeatureCandidate[],metrics:V93FeatureMetric[],policy:V93Policy){
  const sortedCatalog=catalog.slice().sort((a,b)=>a.id.localeCompare(b.id));
  const catalogIds=new Set(sortedCatalog.map(x=>x.id));
  const seen=new Set<string>();
  const duplicateMetricFeatureIds:string[]=[];
  const unknownMetricFeatureIds:string[]=[];
  const metricMap=new Map<string,V93FeatureMetric>();
  for(const metric of metrics.slice().sort((a,b)=>a.featureId.localeCompare(b.featureId))){
    if(!catalogIds.has(metric.featureId)){unknownMetricFeatureIds.push(metric.featureId);continue;}
    if(seen.has(metric.featureId)){duplicateMetricFeatureIds.push(metric.featureId);continue;}
    seen.add(metric.featureId);metricMap.set(metric.featureId,metric);
  }
  const complete=sortedCatalog.map(c=>metricMap.get(c.id)??emptyMetric(c.id,c.horizon));
  const fdr=benjaminiHochberg(complete.map(m=>({id:m.featureId,pValue:m.pValue})),policy.fdrAlpha);
  const fdrMap=new Map(fdr.map(x=>[x.id,x] as const));
  const results:V93TournamentResult[]=complete.map(m=>{
    const f=fdrMap.get(m.featureId)!;
    const promotion=assessV93Promotion(m,f.qValue,policy);
    const disposition=dispositionFor(m,promotion);
    return{...m,qValue:f.qValue,significant:f.significant,disposition,promotion};
  }).sort((a,b)=>a.featureId.localeCompare(b.featureId));
  const counts=Object.fromEntries([...new Set(results.map(x=>x.disposition))].sort().map(d=>[d,results.filter(x=>x.disposition===d).length]));
  return{
    catalogCount:sortedCatalog.length,
    dispositionCount:results.length,
    fdrScopeCount:complete.length,
    v94CandidateCount:results.filter(x=>x.disposition==='V94_CANDIDATE').length,
    duplicateMetricFeatureIds:[...new Set(duplicateMetricFeatureIds)].sort(),
    unknownMetricFeatureIds:[...new Set(unknownMetricFeatureIds)].sort(),
    counts,
    results,
  };
}
