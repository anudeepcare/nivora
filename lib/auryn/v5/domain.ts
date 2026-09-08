import type {CanonicalMarketSnapshot} from '../market-truth';
import type {AurynV4CoreAnalysis,PrimaryInvestmentAction,HorizonDecision} from '../v4/domain';
import type {TechnicalSnapshot,Bar} from '../../nivora-technical-engine';

export type MetricFamily='TREND'|'MOMENTUM'|'VOLUME_FLOW'|'VOLATILITY'|'STRUCTURE'|'RELATIVE_STRENGTH'|'BUSINESS'|'FUNDAMENTALS'|'VALUATION'|'THESIS'|'MOAT'|'NARRATIVE'|'POSITIONING'|'CATALYSTS'|'SECTOR'|'MACRO'|'RISK';
export type MetricRole='DECISION'|'TIMING'|'RISK'|'CONTEXT'|'EXPLANATION';
export type MetricDirection='BULLISH'|'BEARISH'|'NEUTRAL'|'MIXED'|'N/A'|'OVERBOUGHT'|'OVERSOLD'|'HIGH'|'LOW'|'STRONG'|'WEAK';
export interface ProfessionalMetric {id:string;label:string;family:MetricFamily;role:MetricRole;value:number|string|null;unit?:string|null;state:MetricDirection;interpretation:string;available:boolean;higherIsBetter:boolean|null;source:string;timeframe?:string|null;decisionImpact?:'POSITIVE'|'NEGATIVE'|'NEUTRAL'|'CONTEXT'|'UNAVAILABLE';}
export type PatternType='EARLY_REVERSAL'|'CONFIRMED_REVERSAL'|'BASE_BUILDING'|'BREAKOUT_READY'|'BREAKOUT_CONFIRMED'|'RETEST_ENTRY'|'TREND_CONTINUATION'|'MEAN_REVERSION'|'OVERSOLD_BOUNCE'|'DISTRIBUTION'|'FAILED_BREAKOUT'|'TREND_BREAKDOWN'|'DOUBLE_BOTTOM'|'HEAD_AND_SHOULDERS'|'INVERSE_HEAD_AND_SHOULDERS'|'TRIANGLE_COMPRESSION'|'GAP_RECLAIM'|'UNKNOWN';
export interface PatternSignal {type:PatternType;state:'FORMING'|'CONFIRMED'|'FAILED'|'WATCH';confidence:'HIGH'|'MEDIUM'|'LOW';score:number;summary:string;trigger:number|null;invalidation:number|null;target:number|null;supportingMetrics:string[];}
export interface ScenarioLeg {label:'BULL'|'BASE'|'BEAR';summary:string;trigger:number|null;zoneLow:number|null;zoneHigh:number|null;targetLow:number|null;targetHigh:number|null;invalidation:number|null;confidence:'HIGH'|'MEDIUM'|'LOW';}
export interface ScenarioMap {snapshotId:string|null;intent:ExecutionIntent;structure:string;setup:string;confluenceScore:number;waveContext:{label:string;confidence:'HIGH'|'MEDIUM'|'LOW';note:string};bull:ScenarioLeg;base:ScenarioLeg;bear:ScenarioLeg;}
export interface PriceZone {label:string;low:number;high:number;multiplier:number;basis:string;}
export type ExecutionIntent='ACCUMULATE'|'WATCH'|'REDUCE'|'EXIT'|'BLOCKED';
export interface ExecutionPlan {snapshotId:string;state:'READY'|'BLOCKED';intent:ExecutionIntent;reason:string;currentPrice:number|null;initialEntry:PriceZone|null;dcaZones:PriceZone[];confirmation:number|null;invalidation:number|null;targets:Array<{label:string;price:number}>;riskPerShare:number|null;}
export interface AurynV5Decision {primaryAction:PrimaryInvestmentAction;ownerAction:PrimaryInvestmentAction;horizonDecisions:HorizonDecision[];summary:string;why:string[];watch:string[];confidenceLabel:'HIGH'|'MEDIUM'|'LOW';confidenceScore:number;}
export interface CanonicalAnalysisSnapshot {version:'auryn-v5';engineVersion:string;snapshotId:string;symbol:string;asOf:string;marketTruth:CanonicalMarketSnapshot;v4:AurynV4CoreAnalysis;technical:TechnicalSnapshot|null;bars:Bar[];metrics:ProfessionalMetric[];patterns:PatternSignal[];scenario:ScenarioMap|null;executionPlan:ExecutionPlan;decision:AurynV5Decision;}
