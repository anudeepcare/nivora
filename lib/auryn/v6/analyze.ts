import type {CanonicalAnalysisSnapshot as AurynV5Snapshot} from '../v5/domain';
import type {PortfolioRisk} from '../../nivora-portfolio-risk';
import type {AurynV6Analysis,ModelProofSummary} from './domain';
import {AURYN_V6_ENGINE_VERSION} from './version';
import {summarizeModelProof} from './proof';
import {buildMultiTimeframeTechnical} from './timeframes';
import {resolveValuationMethod} from './valuation-registry';
import {applyPortfolioCioOverlay} from './portfolio-cio';

export function buildAurynV6Analysis({v5,modelProof,portfolioRisk,owns=false,currentPositionPct=0,sameArchetypeExposurePct=0}:{v5:AurynV5Snapshot;modelProof?:ModelProofSummary|null;portfolioRisk?:PortfolioRisk|null;owns?:boolean;currentPositionPct?:number;sameArchetypeExposurePct?:number;}):AurynV6Analysis{
  const proof=modelProof??summarizeModelProof([]);
  const multiTimeframe=buildMultiTimeframeTechnical(v5.bars,v5.technical);
  const valuation=resolveValuationMethod(v5.v4.classification,v5.v4.factors.VALUATION);
  const evidenceConfidence={score:v5.v4.confidence.score,label:v5.v4.confidence.label,note:'Current evidence quality, freshness, model suitability and agreement. This is not a probability of profit.'} as const;
  const decisionStrength={score:v5.decision.confidenceScore,label:v5.decision.confidenceLabel,note:'Current decision conviction after thesis, valuation, timing and risk resolution; not a historical win probability.'} as const;
  const portfolio=portfolioRisk?applyPortfolioCioOverlay({independentAction:v5.decision.primaryAction,portfolioRisk,owns,currentPositionPct,sameArchetypeExposurePct}):null;
  return{version:'auryn-v6',engineVersion:AURYN_V6_ENGINE_VERSION,snapshotId:v5.snapshotId,symbol:v5.symbol,asOf:v5.asOf,v5,evidenceConfidence,decisionStrength,modelProof:proof,multiTimeframe,valuation,portfolio};
}
