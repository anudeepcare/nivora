import type {CanonicalMarketSnapshot} from '../market-truth';
import {stableFingerprint} from '../v931/decision-snapshot';
import type {AurynMarketIntelligenceSnapshot,AurynTimeframe,TimeframeBarSet,TimeframeTechnicalState} from './domain';
import {computeTimeframeTechnicalState} from './timeframes';
import {buildStructuralPriceMap} from './zones';
import {V934_INTELLIGENCE_VERSION} from './version';

const ORDER:AurynTimeframe[]=['15M','1H','4H','1D','1W'];
function alignment(states:TimeframeTechnicalState[]){
  if(!states.length)return 'INSUFFICIENT';const buy=states.filter(x=>x.rating==='BUY').length,sell=states.filter(x=>x.rating==='SELL').length;
  if(buy===states.length)return 'BULLISH_ALIGNED';if(sell===states.length)return 'BEARISH_ALIGNED';if(buy>=Math.ceil(states.length*.6))return 'BULLISH_BIAS';if(sell>=Math.ceil(states.length*.6))return 'BEARISH_BIAS';return 'MIXED';
}
export function buildAurynMarketIntelligenceSnapshot(input:{symbol:string;marketTruth:CanonicalMarketSnapshot;confirmedBars:TimeframeBarSet;benchmarkBars?:TimeframeBarSet;previewBars?:TimeframeBarSet;benchmark?:string|null}):AurynMarketIntelligenceSnapshot{
  const symbol=String(input.symbol||'').toUpperCase(),benchmark=input.benchmark??(symbol.includes('/')?'BTC/USD':'SPY');const confirmed:Partial<Record<AurynTimeframe,TimeframeTechnicalState>>={},livePreview:Partial<Record<AurynTimeframe,TimeframeTechnicalState>>={};
  for(const tf of ORDER){const bars=input.confirmedBars[tf];if(bars?.length){const s=computeTimeframeTechnicalState(bars,input.benchmarkBars?.[tf]??null,tf,benchmark);if(s)confirmed[tf]=s}const preview=input.previewBars?.[tf];if(preview?.length){const p=computeTimeframeTechnicalState(preview,input.benchmarkBars?.[tf]??null,tf,benchmark);if(p)livePreview[tf]=p}}
  const actionMap=input.confirmedBars['1D']?.length?buildStructuralPriceMap(input.confirmedBars['1D'],input.confirmedBars['1W']??[]):null;
  const primaryTimeframe:AurynTimeframe=confirmed['1D']?'1D':confirmed['4H']?'4H':confirmed['1W']?'1W':confirmed['1H']?'1H':'15M';const primary=confirmed[primaryTimeframe];const live=livePreview[primaryTimeframe];const confList=ORDER.map(tf=>confirmed[tf]).filter(Boolean) as TimeframeTechnicalState[];
  const coverage={requested:ORDER,confirmed:ORDER.filter(tf=>Boolean(confirmed[tf])),preview:ORDER.filter(tf=>Boolean(livePreview[tf])),missing:ORDER.filter(tf=>!confirmed[tf])};
  const canonical={version:V934_INTELLIGENCE_VERSION,symbol,asOf:input.marketTruth.asOf,marketTruthSnapshotId:input.marketTruth.snapshotId,session:input.marketTruth.session,calendarState:input.marketTruth.calendarState,displayPrice:input.marketTruth.displayPrice,decisionPrice:input.marketTruth.decisionPrice,priceState:input.marketTruth.priceState,priceUse:input.marketTruth.priceUse,confirmed,livePreview,actionMap,summary:{primaryTimeframe,confirmedRating:primary?.rating??'NEUTRAL',liveRating:live?.rating??null,alignment:alignment(confList),researchActive:Boolean(input.marketTruth.displayPrice!=null||input.marketTruth.decisionPrice!=null)},coverage};
  const fingerprint=stableFingerprint(canonical);return{...canonical,fingerprint,snapshotId:`${symbol}-mi-${fingerprint}`};
}
