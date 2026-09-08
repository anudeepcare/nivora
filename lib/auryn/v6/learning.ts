import type {AurynV6Analysis} from './domain';

export function serializeV6Decision(v6:AurynV6Analysis){
 return{
  version:v6.version,
  engineVersion:v6.engineVersion,
  snapshotId:v6.snapshotId,
  symbol:v6.symbol,
  asOf:v6.asOf,
  primaryAction:v6.v5.decision.primaryAction,
  ownerAction:v6.v5.decision.ownerAction,
  horizons:v6.v5.decision.horizonDecisions.map(h=>({horizon:h.horizon,action:h.action})),
  classification:v6.v5.v4.classification,
  thesis:{strength:v6.v5.v4.thesis.strength,direction:v6.v5.v4.thesis.direction},
  evidenceConfidence:v6.evidenceConfidence,
  decisionStrength:v6.decisionStrength,
  modelProof:{grade:v6.modelProof.grade,exactSampleN:v6.modelProof.exactSampleN,promotionEligible:v6.modelProof.promotion.eligible},
  valuation:v6.valuation,
  multiTimeframe:{alignment:v6.multiTimeframe.alignment,summary:v6.multiTimeframe.summary,daily:v6.multiTimeframe.daily,weekly:v6.multiTimeframe.weekly},
  executionPlan:v6.v5.executionPlan,
  portfolio:v6.portfolio,
 };
}
