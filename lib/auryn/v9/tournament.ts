import {evaluateFeature} from './evaluation';
import {benjaminiHochberg} from './statistics';
import {assessFeaturePromotion} from './promotion';
import type {CandidateStatus,FeatureObservation,TournamentResult} from './domain';
export function runFeatureTournament(observations:FeatureObservation[],options:{featureIds?:string[];fdrAlpha?:number}={}){
 const ids=options.featureIds?.length?[...new Set(options.featureIds)]:[...new Set(observations.map(x=>x.featureId))];
 const metrics=ids.map(id=>evaluateFeature(id,observations));
 const fdr=benjaminiHochberg(metrics.map(m=>({id:m.featureId,pValue:m.pValue})),options.fdrAlpha??.05);const q=new Map(fdr.map(x=>[x.id,x]));
 const results:TournamentResult[]=metrics.map(m=>{const f=q.get(m.featureId)!;const promotion=assessFeaturePromotion(m,f.qValue);let status:CandidateStatus='REJECTED';
   if(m.totalN===0)status='UNTESTED';
   else if(m.outOfSampleN>=30&&(m.outOfSampleAvgEdgePct??-Infinity)>0&&m.outOfSampleConfidence95.low>0)status='OOS_SURVIVOR';
   if(status==='OOS_SURVIVOR'&&m.totalN>=120&&m.regimesCovered>=2)status='SHADOW';
   if(promotion.eligible)status='PRODUCTION_CANDIDATE';
   return{...m,qValue:f.qValue,significant:f.significant,status,promotion};
 }).sort((a,b)=>{const rank=(s:CandidateStatus)=>s==='PRODUCTION_CANDIDATE'?5:s==='SHADOW'?4:s==='OOS_SURVIVOR'?3:s==='REJECTED'?2:1;return rank(b.status)-rank(a.status)||(b.outOfSampleAvgEdgePct??-Infinity)-(a.outOfSampleAvgEdgePct??-Infinity)||a.featureId.localeCompare(b.featureId)});
 return{testedFeatureCount:results.filter(x=>x.totalN>0).length,productionCandidateCount:results.filter(x=>x.status==='PRODUCTION_CANDIDATE').length,shadowCount:results.filter(x=>x.status==='SHADOW').length,oosSurvivorCount:results.filter(x=>x.status==='OOS_SURVIVOR').length,rejectedCount:results.filter(x=>x.status==='REJECTED').length,results};
}
