import type {HistoricalBar,HistoricalReplayBundle,HistoricalSecurity,HistoricalUniverseSnapshot,PointInTimeMetric} from '../v91/domain';

export const AURYN_V92_VERSION='auryn-v9.2-historical-backfill-1';

export type ProviderDescriptor={source:string;symbol:string;exchange:string|null;timezone:string|null;currency:string|null;assetType:string|null;rows:number};

export type V92AssemblyInput={
  datasetId:string;
  version?:string|null;
  source:string;
  benchmarkSymbol:string;
  generatedAt?:string|null;
  securities:HistoricalSecurity[];
  dailyBars:HistoricalBar[];
  benchmarkBars:HistoricalBar[];
  facts?:PointInTimeMetric[];
  events?:PointInTimeMetric[];
  universeSnapshots?:HistoricalUniverseSnapshot[];
  pointInTimeUniverse?:boolean;
  includesDelisted?:boolean;
  delistingReturnsHandled?:boolean;
};

export type V92IntegrityReport={
  version:string;
  status:'PASS'|'BLOCKED';
  quality:'DECISION_GRADE'|'LIMITED'|'INVALID';
  hardFailures:string[];
  warnings:string[];
  survivorshipSafe:boolean;
  coverage:{
    securities:number;
    symbolsWithBars:number;
    benchmarkBars:number;
    facts:number;
    events:number;
    universeSnapshots:number;
    years:Record<string,number>;
    barsBySymbol:Record<string,number>;
    factMetrics:Record<string,number>;
    missingSecurityBars:string[];
  };
  bundle:Pick<HistoricalReplayBundle,'meta'>;
};
