import {generateFeatureCatalog} from '../v9/feature-registry';
import type {FeatureCandidate} from '../v9/domain';
import {materializeFeatureShard} from '../v91/materialize';
import type {HistoricalBaseObservation,HistoricalObservationManifest} from '../v91/domain';
import {evaluateV93Feature} from './metrics';
import {V93_POLICY} from './policy';
import type {V93FeatureMetric,V93Policy} from './domain';
import {finalizeV93Tournament} from './tournament';
import {deterministicFingerprint} from './report';
import {AURYN_V93_VERSION} from './version';

export type V93RunnerOptions={candidateStart?:number;candidateLimit?:number;shardSize?:number;policy?:V93Policy};

export function runV93TournamentFromBaseObservations(baseObservations:HistoricalBaseObservation[],manifest:HistoricalObservationManifest,options:V93RunnerOptions={}){
  const policy=options.policy??V93_POLICY;
  const canonical=generateFeatureCatalog();
  const start=Math.max(0,Math.floor(options.candidateStart??0));
  const requested=options.candidateLimit==null?canonical.length-start:Math.max(0,Math.floor(options.candidateLimit));
  const selected=canonical.slice(start,start+requested);
  const shardSize=Math.max(1,Math.min(2000,Math.floor(options.shardSize??256)));
  const metrics:V93FeatureMetric[]=[];
  for(let i=0;i<selected.length;i+=shardSize){
    const shard:FeatureCandidate[]=selected.slice(i,i+shardSize);
    const materialized=materializeFeatureShard(baseObservations,shard);
    const byFeature=new Map<string,typeof materialized.observations>();
    for(const row of materialized.observations){const a=byFeature.get(row.featureId)??[];a.push(row);byFeature.set(row.featureId,a);}
    for(const candidate of shard)metrics.push(evaluateV93Feature(candidate.id,byFeature.get(candidate.id)??[],policy));
  }
  metrics.sort((a,b)=>a.featureId.localeCompare(b.featureId));
  const tournament=finalizeV93Tournament(selected,metrics,policy);
  const completeCatalog=start===0&&selected.length===canonical.length;
  const reportCore={
    version:AURYN_V93_VERSION,
    policy,
    upstream:{
      observationVersion:manifest.version,
      datasetId:manifest.datasetId,
      datasetVersion:manifest.datasetVersion,
      source:manifest.source,
      quality:manifest.quality,
      survivorshipSafe:manifest.survivorshipSafe,
      adjustedPricesVerified:manifest.adjustedPricesVerified,
      baseObservations:baseObservations.length,
    },
    catalog:{canonicalCount:canonical.length,selectedCount:selected.length,candidateStart:start,completeCatalog},
    tournament,
    safety:{researchOnly:true,productionRegistryMutated:false,cioMutated:false,marketTruthMutated:false,brokerPermissionsMutated:false},
  };
  const report={...reportCore,deterministicFingerprint:deterministicFingerprint(reportCore)};
  const survivors=tournament.results.filter(x=>x.disposition==='V94_CANDIDATE').map(x=>({
    featureId:x.featureId,qValue:x.qValue,oosN:x.oosN,oosAvgEdgePct:x.oosAvgEdgePct,costStressOosAvgEdgePct:x.costStressOosAvgEdgePct,oosConfidence95:x.oosConfidence95,oosInformationCoefficient:x.oosInformationCoefficient,oosHitRatePct:x.oosHitRatePct,positiveFoldPct:x.positiveFoldPct,regimePositivePct:x.regimePositivePct,archetypePositivePct:x.archetypePositivePct,sectorPositivePct:x.sectorPositivePct,blockers:x.promotion.blockers,
  }));
  const survivorRegistry={version:AURYN_V93_VERSION,sourceFingerprint:report.deterministicFingerprint,researchOnly:true,autoProductionPromotion:false,featureCount:survivors.length,featureIds:survivors.map(x=>x.featureId),survivors};
  const rejections=tournament.results.filter(x=>x.disposition!=='V94_CANDIDATE').map(x=>({featureId:x.featureId,disposition:x.disposition,blockers:x.promotion.blockers,qValue:x.qValue,totalN:x.totalN,oosN:x.oosN}));
  return{report,survivorRegistry,rejections};
}
