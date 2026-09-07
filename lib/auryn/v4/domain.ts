import type {EvidenceScope,EvidenceSource} from "../evidence";
import type {MetricValidationState} from "../../v65/domain";

export type PrimaryInvestmentAction=
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "REDUCE"
  | "SELL"
  | "INSUFFICIENT_EVIDENCE";

export type Horizon="NOW"|"SWING"|"SIX_TO_TWELVE_MONTHS"|"THREE_TO_FIVE_YEARS";

export type BusinessModel=
  | "SAAS_SOFTWARE"
  | "MARKETPLACE_ADTECH"
  | "SEMICONDUCTOR_DESIGNER"
  | "SEMICONDUCTOR_MEMORY_CYCLICAL"
  | "NETWORKING_COMPUTE_INFRA"
  | "AI_DATA_CENTER_INFRA"
  | "POWER_UTILITY_INFRA"
  | "BANK"
  | "INSURER"
  | "FINTECH_PAYMENTS"
  | "REIT"
  | "BIOTECH_PHARMA"
  | "MEDTECH"
  | "ENERGY"
  | "INDUSTRIAL"
  | "CONSUMER"
  | "SPACE_SATELLITE"
  | "DEFENSE"
  | "MINER_COMMODITY"
  | "GENERAL_COMPOUNDER"
  | "TURNAROUND_DISTRESSED";

export type LifecycleStage=
  | "PRE_COMMERCIAL"
  | "VALIDATION"
  | "INFLECTION"
  | "HYPERGROWTH"
  | "SCALE"
  | "COMPOUNDER"
  | "MATURITY"
  | "DECLINE_OR_REINVENTION";

export type CanonicalFactorKey=
  | "BUSINESS_QUALITY"
  | "GROWTH_INFLECTION"
  | "MOAT"
  | "NARRATIVE_EXPECTATIONS"
  | "FUNDAMENTALS_EARNINGS"
  | "VALUATION"
  | "TECHNICALS"
  | "POSITIONING"
  | "CATALYSTS"
  | "SECTOR_INDUSTRY"
  | "MACRO_REGIME"
  | "RISK";

export interface EvidenceRef {
  id:string;
  key:string;
  source:EvidenceSource;
  scope:EvidenceScope;
  asOf:string|null;
  validationState:MetricValidationState;
}

export interface EvidenceBackedReason {
  id:string;
  text:string;
  evidenceIds:string[];
}

export interface SecurityClassificationInput {
  assetType?:string|null;
  sector?:string|null;
  industry?:string|null;
  name?:string|null;
  description?:string|null;
  revenue?:number|null;
  revenueGrowth?:number|null;
  operatingMargin?:number|null;
  fcf?:number|null;
  profitable?:boolean|null;
  archetypeHint?:string|null;
  strategicTheme?:string|null;
}

export interface SecurityClassification {
  assetClass:"EQUITY"|"ETF"|"REIT"|"FINANCIAL"|"BIOTECH"|"MINER"|"CRYPTO"|"OTHER";
  sector:string|null;
  industry:string|null;
  businessModel:BusinessModel;
  lifecycle:LifecycleStage;
  capitalIntensity:"LOW"|"MEDIUM"|"HIGH"|"EXTREME"|"UNKNOWN";
  cyclicality:"DEFENSIVE"|"MODERATE"|"CYCLICAL"|"HIGHLY_CYCLICAL"|"UNKNOWN";
  profitabilityStage:"PRE_REVENUE"|"PRE_PROFIT"|"PROFITABLE"|"MATURE"|"UNKNOWN";
  confidence:number;
  evidenceIds:string[];
}

export interface FactorObservation {
  factor:CanonicalFactorKey;
  score:number|null;
  reason:string;
  evidenceIds:string[];
  validationState:MetricValidationState;
}

export interface FactorAssessment extends FactorObservation {
  weight:number;
  available:boolean;
}

export interface MoatAssessment {
  score:number|null;
  direction:"EXPANDING"|"STABLE"|"ERODING"|"UNKNOWN";
  delta:number|null;
  drivers:EvidenceBackedReason[];
  threats:EvidenceBackedReason[];
}

export interface InvestmentThesis {
  strength:number|null;
  direction:"STRENGTHENING"|"STABLE"|"WEAKENING"|"BROKEN";
  directionDelta:number|null;
  companyState:string;
  whyItCanWin:EvidenceBackedReason[];
  marketMayBeMissing:EvidenceBackedReason[];
  strengtheningEvidence:EvidenceBackedReason[];
  weakeningEvidence:EvidenceBackedReason[];
  invalidationConditions:string[];
  evidenceFingerprint:string;
  lastMaterialChangeAt:string;
}

export interface NarrativeAssessment {
  marketNarrative:EvidenceBackedReason[];
  aurynThesis:EvidenceBackedReason[];
  contrarianEdge:{
    state:"POSITIVE_EDGE"|"NEGATIVE_EDGE"|"CONSENSUS_ALIGNED"|"NO_DEFENSIBLE_EDGE";
    reason:EvidenceBackedReason|null;
  };
}

export interface DecisionConfidence {
  score:number;
  label:"HIGH"|"MEDIUM"|"LOW";
  coverage:number;
  freshness:number;
  sourceQuality:number;
  modelSuitability:number;
  agreement:number;
  validationState:MetricValidationState;
}

export interface HorizonDecision {
  horizon:Horizon;
  action:PrimaryInvestmentAction;
  confidence:DecisionConfidence;
  reasonCodes:string[];
}

export interface AnalystEvidenceBundle {
  symbol:string;
  asOf:string;
  classificationInput:SecurityClassificationInput;
  evidenceRefs:EvidenceRef[];
  evidenceConflicts:string[];
  observations:FactorObservation[];
  moatSignals:FactorObservation[];
  moatReasons:{drivers:EvidenceBackedReason[];threats:EvidenceBackedReason[]};
  slowEvidenceFingerprint:string;
  priorThesis?:{strength:number;evidenceFingerprint:string;lastMaterialChangeAt:string};
  priorMoat?:{score:number;evidenceFingerprint:string;lastMaterialChangeAt:string};
  narrative:{market:EvidenceBackedReason[];auryn:EvidenceBackedReason[];expectationGapScore:number|null};
  thesisReasons:{positive:EvidenceBackedReason[];negative:EvidenceBackedReason[];marketMayBeMissing:EvidenceBackedReason[]};
  thesisInvalidators:string[];
  hardVetoes:string[];
  softConstraints:string[];
}

export interface AurynV4CoreAnalysis {
  version:"auryn-v4";
  engineVersion:string;
  symbol:string;
  classification:SecurityClassification;
  analystModel:{id:string;version:string;suitability:number};
  factors:Partial<Record<CanonicalFactorKey,FactorAssessment>>;
  thesis:InvestmentThesis;
  moat:MoatAssessment;
  narrative:NarrativeAssessment;
  primaryAction:PrimaryInvestmentAction;
  horizonDecisions:HorizonDecision[];
  confidence:DecisionConfidence;
  reasonCodes:string[];
}
