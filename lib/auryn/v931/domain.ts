import type {CanonicalMarketSnapshot} from '../market-truth';
import type {PrimaryInvestmentAction} from '../v4/domain';

export const V931_VERSION='auryn-v9.3.1' as const;
export type SetupState='DAMAGED'|'REPAIRING'|'RECLAIM_ATTEMPT'|'BREAKOUT_WATCH'|'BREAKOUT_READY'|'BREAKOUT_CONFIRMED'|'TRENDING'|'WEAKENING'|'FAILED_RECLAIM';
export type PillarKey='business'|'earningsRevisions'|'valuation'|'marketStructure'|'catalystsRegime'|'riskAsymmetry';
export type InstitutionalNewMoneyAction='STRONG_BUY'|'BUY'|'START_SMALL'|'WAIT'|'AVOID';
export type InstitutionalOwnerAction='ADD'|'HOLD'|'WATCH'|'REDUCE'|'EXIT';
export type InstitutionalLongTermAction='ATTRACTIVE'|'SELECTIVE'|'UNATTRACTIVE';
export type PillarEvidence={why:string;evidenceIds:string[];asOf?:string|null};
export type Pillar={key:PillarKey;label:string;score:number|null;state:'STRONG'|'CONSTRUCTIVE'|'MIXED'|'WEAK'|'UNAVAILABLE';impact:'POSITIVE'|'NEGATIVE'|'NEUTRAL'|'UNAVAILABLE';why:string;evidenceIds:string[];asOf?:string|null};
export type DecisionAttribution={pillar:PillarKey;label:string;score:number|null;weight:number;contribution:number;direction:'POSITIVE'|'NEGATIVE'|'NEUTRAL'|'UNAVAILABLE'};
export type GroundedEvidence={id:string;text:string;values:number[];horizon:string;asOf?:string|null;source?:string|null};
export type DecisionSnapshot={version:typeof V931_VERSION;snapshotId:string;fingerprint:string;symbol:string;asOf:string;marketTruth:CanonicalMarketSnapshot;completedDailyBarCutoff:string|null;fundamentalsAsOf:string|null;earningsAsOf:string|null;estimatesAsOf:string|null;newsCutoff:string|null;macroAsOf:string|null;featureVersion:string;modelVersion:string;policyVersion:string;evidence:Record<string,unknown>};
export type InstitutionalDecision={version:typeof V931_VERSION;snapshotId:string;symbol:string;newMoneyAction:InstitutionalNewMoneyAction;ownerAction:InstitutionalOwnerAction;longTermAction:InstitutionalLongTermAction;executionAction:'READY'|'BLOCKED';canonicalPrimaryAction:PrimaryInvestmentAction|InstitutionalNewMoneyAction;legacyChallengerAction:PrimaryInvestmentAction|null;hardVetoReasons:string[];policyReasons:string[];setupState:SetupState;decisionScore:number;confidenceScore:number;confidenceBasis:'EVIDENCE_QUALITY_UNCALIBRATED';evidenceCompleteness:number;pillars:Record<PillarKey,Pillar>;attribution:DecisionAttribution[];drivers:string[];counterEvidence:string[];nextDecisionTrigger:string;invalidationTrigger:string|null;horizons:{now:string;swing:string;sixToTwelveMonths:string;threeToFiveYears:string};changeExplanation:{changed:boolean;from:SetupState|null;to:SetupState;trigger:string;changedEvidence:string[];unchangedEvidence:string[]}};
