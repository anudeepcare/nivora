import type {PrimaryInvestmentAction} from '../v4/domain';

export type ProofGrade='UNPROVEN'|'EMERGING'|'VALIDATED'|'ELITE';
export type ProofRegime='RISK_ON'|'NEUTRAL'|'RISK_OFF'|'UNKNOWN';
export type ProofHorizon='30D'|'90D'|'180D'|'1Y'|'2Y'|string;

export interface ExactOutcomeObservation{
  action:PrimaryInvestmentAction;
  alphaPct:number;
  horizon:ProofHorizon;
  archetype:string;
  regime:ProofRegime;
  maxDrawdownPct:number|null;
  confidenceScore?:number|null;
}

export interface ActionLadderBucket{
  action:PrimaryInvestmentAction;
  n:number;
  avgAlphaPct:number|null;
}

export interface ActionLadderAssessment{
  orderedActions:PrimaryInvestmentAction[];
  buckets:ActionLadderBucket[];
  monotonic:boolean;
  comparablePairs:number;
  violations:string[];
}

export interface PromotionGate{
  eligible:boolean;
  blockers:string[];
  checks:{
    exactSample:boolean;
    positiveAlpha:boolean;
    drawdownControlled:boolean;
    actionLadder:boolean;
    regimeBreadth:boolean;
    horizonBreadth:boolean;
  };
}

export interface ModelProofSummary{
  grade:ProofGrade;
  exactSampleN:number;
  avgAlphaPct:number|null;
  hitRatePct:number|null;
  avgMaxDrawdownPct:number|null;
  regimesCovered:number;
  horizonsCovered:number;
  archetypesCovered:number;
  actionLadder:ActionLadderAssessment;
  promotion:PromotionGate;
  note:string;
}

import type {CanonicalAnalysisSnapshot as AurynV5Snapshot} from '../v5/domain';
import type {MultiTimeframeTechnical} from './timeframes';
import type {ValuationMethodAssessment} from './valuation-registry';
import type {PortfolioCioOverlay} from './portfolio-cio';

export interface ConfidenceDescriptor{
  score:number;
  label:'HIGH'|'MEDIUM'|'LOW';
  note:string;
}

export interface AurynV6Analysis{
  version:'auryn-v6';
  engineVersion:string;
  snapshotId:string;
  symbol:string;
  asOf:string;
  v5:AurynV5Snapshot;
  evidenceConfidence:ConfidenceDescriptor;
  decisionStrength:ConfidenceDescriptor;
  modelProof:ModelProofSummary;
  multiTimeframe:MultiTimeframeTechnical;
  valuation:ValuationMethodAssessment;
  portfolio:PortfolioCioOverlay|null;
}
