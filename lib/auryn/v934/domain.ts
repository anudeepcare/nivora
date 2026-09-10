import type {Bar} from '../../nivora-technical-engine';

export type AurynTimeframe='15M'|'1H'|'4H'|'1D'|'1W';
export type TechnicalRating='BUY'|'NEUTRAL'|'SELL';
export type IndicatorFamily='MOVING_AVERAGE'|'OSCILLATOR'|'PARTICIPATION'|'RELATIVE_STRENGTH'|'VOLATILITY'|'STRUCTURE';
export type IndicatorComponent={
  id:string;label:string;family:IndicatorFamily;value:number|null;rating:TechnicalRating;reason:string;
};
export type TimeframeTechnicalState={
  timeframe:AurynTimeframe;asOf:string;price:number;rating:TechnicalRating;score:number;
  counts:{buy:number;neutral:number;sell:number};components:IndicatorComponent[];
  trend:{score:number;label:string};momentum:{score:number;label:string};participation:{score:number;label:string};
  relativeStrength:{benchmark:string|null;score:number;returnPct:number|null;benchmarkReturnPct:number|null;relativePct:number|null};
  volatility:{atr:number;atrPct:number;realizedVolPct:number|null;regime:'LOW'|'NORMAL'|'HIGH'};
  sourceBarCount:number;confirmed:true;
};
export type StructuralLevelEvidence={kind:string;timeframe:AurynTimeframe|'MULTI';price:number;weight:number;note:string};
export type StructuralZone={low:number;high:number;mid:number;side:'SUPPORT'|'RESISTANCE';score:number;confidence:'LOW'|'MEDIUM'|'HIGH';evidence:StructuralLevelEvidence[]};
export type StructuralPriceMap={
  preferredEntry:{low:number;high:number;confidence:'LOW'|'MEDIUM'|'HIGH';evidence:StructuralLevelEvidence[]}|null;
  confirm:number|null;support:number|null;majorSupport:number|null;invalidation:number|null;t1:number|null;t2:number|null;
  supportZone:StructuralZone|null;resistanceZone:StructuralZone|null;zones:StructuralZone[];asOf:string;
};
export type TimeframeBarSet=Partial<Record<AurynTimeframe,Bar[]>>;

export type AurynMarketIntelligenceSnapshot={
  version:string;snapshotId:string;fingerprint:string;symbol:string;asOf:string;
  marketTruthSnapshotId:string;session:string;calendarState:string;displayPrice:number|null;decisionPrice:number|null;priceState:string;priceUse:string;
  confirmed:Partial<Record<AurynTimeframe,TimeframeTechnicalState>>;
  livePreview:Partial<Record<AurynTimeframe,TimeframeTechnicalState>>;
  actionMap:StructuralPriceMap|null;
  summary:{primaryTimeframe:AurynTimeframe;confirmedRating:TechnicalRating;liveRating:TechnicalRating|null;alignment:string;researchActive:boolean};
  coverage:{requested:AurynTimeframe[];confirmed:AurynTimeframe[];preview:AurynTimeframe[];missing:AurynTimeframe[]};
};
