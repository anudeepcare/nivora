export type HistoricalQuality='DECISION_GRADE'|'LIMITED'|'INVALID';

export type HistoricalBar={
  symbol:string;
  date:string;
  open:number;
  high:number;
  low:number;
  close:number;
  volume:number;
  adjusted:boolean;
};

export type HistoricalSecurity={
  symbol:string;
  archetype?:string|null;
  sector?:string|null;
  industry?:string|null;
  activeFrom?:string|null;
  activeTo?:string|null;
  delistedDate?:string|null;
  delistingReturnPct?:number|null;
};

export type PointInTimeMetric={
  symbol:string;
  metric:string;
  value:number;
  periodEnd?:string|null;
  availableAt:string;
};

export type HistoricalUniverseSnapshot={date:string;symbols:string[]};

export type HistoricalCorporateAction={
  symbol:string;
  type:'SPLIT'|'DIVIDEND';
  date:string;
  ratio:number|null;
  amount:number|null;
  availableAt:string;
  source:string;
};

export type HistoricalReplayBundle={
  meta:{
    datasetId:string;
    version?:string|null;
    source:string;
    benchmarkSymbol:string;
    adjustedPrices:boolean;
    pointInTimeUniverse:boolean;
    includesDelisted:boolean;
    delistingReturnsHandled:boolean;
    generatedAt?:string|null;
  };
  securities:HistoricalSecurity[];
  dailyBars:HistoricalBar[];
  benchmarkBars:HistoricalBar[];
  facts?:PointInTimeMetric[];
  events?:PointInTimeMetric[];
  universeSnapshots?:HistoricalUniverseSnapshot[];
  corporateActions?:HistoricalCorporateAction[];
  adapterCoverage?:Record<string,string[]>;
};

export type HistoricalQualityReport={
  quality:HistoricalQuality;
  valid:boolean;
  decisionGrade:boolean;
  survivorshipSafe:boolean;
  adjustedPricesVerified:boolean;
  errors:string[];
  warnings:string[];
  counts:{securities:number;dailyBars:number;benchmarkBars:number;facts:number;events:number;universeSnapshots:number};
};

export type ForwardOutcome={
  horizon:string;
  sessions:number;
  forwardReturnPct:number;
  benchmarkReturnPct:number;
  maxDrawdownPct:number;
};

export type HistoricalBaseObservation={
  symbol:string;
  asOf:string;
  archetype:string;
  sector:string|null;
  regime:string;
  benchmarkSymbol:string;
  close:number;
  metrics:Record<string,number>;
  outcomes:Record<string,ForwardOutcome>;
  costBps:number;
};

export type HistoricalObservationManifest={
  version:string;
  datasetId:string;
  datasetVersion:string|null;
  source:string;
  quality:HistoricalQuality;
  survivorshipSafe:boolean;
  adjustedPricesVerified:boolean;
  warnings:string[];
  symbolsProcessed:number;
  datesProcessed:number;
  baseObservations:number;
  observationsByHorizon:Record<string,number>;
  missingMetricCounts:Record<string,number>;
  skipped:{insufficientHistory:number;outsideHistoricalUniverse:number;noForwardOutcome:number};
};
