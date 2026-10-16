import type {ResearchStructure} from './research-structure';

export type StructureChartOverlays={scale:'linear'|'log';lines:Array<{label:string;price:number;color:string}>;series:Array<{label:string;color:string;points:Array<{time:string;value:number}>}>};
type MappedLevel={label:string;price:number;family:'FIB'|'AVERAGE';period?:50|200};
export type StructureZone={low:number;high:number;levels:MappedLevel[];families:string[];status:'HOLD_OBSERVED'|'TESTED'|'UNCONFIRMED'|'BELOW'};
const valid=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>0;
const money=(x:number)=>'$'+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

/** Describe dated chart observations, never issue an investment action. */
export function buildStructurePresentation(model:ResearchStructure){
 const mapped:MappedLevel[]=model.levels.filter(x=>x.kind==='RETRACEMENT'&&valid(x.price)).map(x=>({label:`Fib ${x.label}`,price:x.price,family:'FIB'}));
 for(const average of Object.values(model.movingAverages))if(valid(average.value))mapped.push({label:`${average.period}-week ${model.averageType}`,price:average.value,family:'AVERAGE',period:average.period});
 mapped.sort((a,b)=>a.price-b.price);
 const zones:StructureZone[]=[];
 for(const level of mapped){
  const previous=zones[zones.length-1];
  if(previous&&(level.price-previous.low)/previous.low<=.015){previous.high=level.price;previous.levels.push(level);previous.families=[...new Set(previous.levels.map(x=>x.family))];}
  else zones.push({low:level.price,high:level.price,levels:[level],families:[level.family],status:'UNCONFIRMED'});
 }
 const weeks=model.weeklyBars,last=weeks[weeks.length-1],prior=weeks[weeks.length-2],knownAfter=model.anchors?.confirmedAt??model.anchors?.end.time;
 for(const zone of zones){
  if(!last||!knownAfter||last.time<=knownAfter)continue;
  if(last.close<zone.low){zone.status='BELOW';continue;}
  // Reconstruct this zone using each average's value at the prior close. Never
  // use the latest moving average to manufacture evidence in an earlier week.
  const priorPrices=zone.levels.map(level=>level.family==='FIB'?level.price:Object.values(model.movingAverages).find(x=>x.period===level.period)?.points.find(x=>x.time===prior?.time)?.value);
  const completePrior=priorPrices.every(valid);
  const priorLow=completePrior?Math.min(...priorPrices as number[]):NaN,priorHigh=completePrior?Math.max(...priorPrices as number[]):NaN;
  const priorOverlap=completePrior&&(priorHigh-priorLow)/priorLow<=.015;
  const priorTest=prior&&Date.parse(last.time)-Date.parse(prior.time)===604800000&&prior.time>knownAfter&&priorOverlap&&prior.low<=priorHigh&&prior.high>=priorLow&&prior.close>priorHigh;
  if(priorTest&&last.low>=zone.low&&last.close>zone.high)zone.status='HOLD_OBSERVED';
  else if(last.low<=zone.high&&last.high>=zone.low&&last.close>zone.high)zone.status='TESTED';
 }
 const close=model.lastClose;
 const supports=valid(close)?zones.filter(x=>x.high<=close):[];
 const nearestSupport=supports[supports.length-1]??null;
 const nearestResistance=valid(close)?zones.find(x=>x.low>close)??null:null;
 const r618=model.levels.find(x=>x.kind==='RETRACEMENT'&&x.ratio===.618);
 const up=model.anchors?.direction==='UP';
 const failureLevel=model.anchors?.start.price??null;
 const headline=!model.anchors?'Select a valid swing':!valid(close)?'Weekly evidence unavailable':r618&&close<r618.price?(up?'Below the 61.8% retracement':'Below the recovery threshold'):(up?'Within the selected upswing':'Recovery into the selected downswing');
 const observation=valid(close)&&r618?`The last completed weekly close, ${money(close)}, is ${close<r618.price?'below':'above'} the 61.8% retracement at ${money(r618.price)}.`:model.reason||'A dated swing is needed to explain retracement levels.';
 const confirmation=nearestSupport?.status==='HOLD_OBSERVED'?'A test followed by a second weekly close above this zone was observed. This rule-based observation does not guarantee support or authorize a buy.':nearestSupport?.status==='TESTED'?'One completed week tested this zone and closed above it. A subsequent hold has not been observed; support remains unconfirmed.':'Support remains unconfirmed. Watch for a weekly test, a close back above the zone, and a subsequent week that holds it.';
 return {zones,nearestSupport,nearestResistance,headline,observation,confirmation,failureLevel,failureDirection:up?'below':'above',overlapTolerance:1.5};
}

/** Only user-selected, valid chart studies reach the canvas. */
export function buildStructureOverlays(model:ResearchStructure,{fib=true,averages=true,extensions=false}:{fib?:boolean;averages?:boolean;extensions?:boolean}={}):StructureChartOverlays{
 const lines=model.levels.filter(x=>valid(x.price)&&(x.kind==='EXTENSION'?extensions:fib)).map(x=>({label:`${x.custom?'Custom':x.kind==='ENDPOINT'?'Anchor':x.kind==='EXTENSION'?'Extension':'Fib'} ${x.ratio.toFixed(3)} · ${(x.ratio*100).toFixed(1)}%`,price:x.price,color:x.custom?'#b778ce':x.kind==='EXTENSION'?'#a78bfa':x.ratio===.618||x.ratio===.786?'#d99c32':'#7895b7'}));
 const series=averages?Object.values(model.movingAverages).filter(x=>valid(x.value)&&x.points.length).map(x=>({label:`${x.period}-week ${model.averageType}`,color:x.period===50?'#4e8fff':'#d99c32',points:x.points})):[];
 return {scale:model.scale,lines,series};
}
