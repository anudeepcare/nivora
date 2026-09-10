import type {FeatureObservation,ResearchHorizon} from '../v9/domain';

export type V93Disposition=
  |'REJECTED_NO_EVIDENCE'
  |'REJECTED_SAMPLE'
  |'REJECTED_WALK_FORWARD'
  |'REJECTED_OOS'
  |'REJECTED_COST'
  |'REJECTED_ROBUSTNESS'
  |'REJECTED_FDR'
  |'V94_CANDIDATE';

export type V93Fold={
  index:number;
  trainStart:string;
  trainEnd:string;
  testStart:string;
  testEnd:string;
  trainRows:FeatureObservation[];
  testRows:FeatureObservation[];
};

export type V93Policy={
  version:string;
  seed:number;
  foldCount:number;
  initialTrainFraction:number;
  minTotalN:number;
  minOosN:number;
  minFoldTestN:number;
  minStabilityGroupN:number;
  minPositiveFoldPct:number;
  minRegimes:number;
  minRegimePositivePct:number;
  minArchetypes:number;
  minArchetypePositivePct:number;
  minSectors:number;
  minSectorPositivePct:number;
  minOosIC:number;
  minOosHitRatePct:number;
  minAvgDrawdownPct:number;
  costStressMultiplier:number;
  fdrAlpha:number;
  bootstrapIterations:number;
  bootstrapConfidence:number;
  purgeCalendarDays:Record<ResearchHorizon,number>;
};

export type V93FoldMetric={index:number;testN:number;meanEdgePct:number|null;costStressMeanEdgePct:number|null};
export type V93FeatureMetric={featureId:string;horizon:string|null;totalN:number;trainN:number;oosN:number;validFoldCount:number;folds:V93FoldMetric[];oosAvgEdgePct:number|null;costStressOosAvgEdgePct:number|null;oosConfidence95:{mean:number;low:number;high:number;iterations:number};oosInformationCoefficient:number|null;oosHitRatePct:number|null;avgMaxDrawdownPct:number|null;positiveFoldPct:number|null;regimesCovered:number;regimePositivePct:number|null;archetypesCovered:number;archetypePositivePct:number|null;sectorsCovered:number;sectorPositivePct:number|null;pValue:number};

export type V93PromotionAssessment={eligible:boolean;checks:Record<string,boolean>;blockers:string[]};
export type V93TournamentResult=V93FeatureMetric&{qValue:number;significant:boolean;disposition:V93Disposition;promotion:V93PromotionAssessment};
