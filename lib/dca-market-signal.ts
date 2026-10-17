import {buildResearchStructure} from './research-structure';
export type DcaMultiple=0|1|2|4;
type Observation={date:string;close:number;average:number;drawdown:number;rsi:number;multiplier:DcaMultiple};
const DAY=86400000;
/** Separates a price condition from permission to allocate capital. */
export function dcaAllocationContext(snapshot:any){
 const decision=snapshot?.research?.decision;
 if(!decision||snapshot?.research?.state!=='READY')return {canSuggestAdding:false,label:'Price signal only'};
 if(decision.hardVetoReasons?.includes('FUNDAMENTAL_THESIS_BREAK'))return {canSuggestAdding:false,label:'Adding paused · thesis review'};
 if(['REDUCE','EXIT'].includes(decision.ownerAction)||decision.newMoneyAction==='AVOID')return {canSuggestAdding:false,label:'Adding paused · risk review'};
 // Even a complete assessment is not a personal contribution recommendation.
 return {canSuggestAdding:false,label:'Price signal only'};
}
/** Experimental research heuristic. No orders, leverage or valuation claims. */
export function buildDcaMarketSignal(input:unknown,options:{asOf?:string;thesisBroken?:boolean}={}){
 const asOf=options.asOf??new Date().toISOString(),model=buildResearchStructure(input,{asOf}),bars=model.weeklyBars;
 const unavailable=(reason:string)=>({multiplier:null as DcaMultiple|null,state:'UNAVAILABLE',label:'History needed',reason,observedAt:model.coverage.lastDate,metrics:null as Observation|null,history:[] as Observation[]});
 if(bars.length<52)return unavailable('52 completed weeks are needed for this signal.');
 if(Date.parse(asOf)-Date.parse(bars.at(-1)!.sourceEndDate)>14*DAY)return unavailable('Price history is out of date. Refresh before using the signal.');
 const history:Observation[]=[];let gain=0,loss=0;
 for(let i=1;i<bars.length;i++){
  const change=bars[i].close-bars[i-1].close;
  if(i<=14){gain+=Math.max(change,0)/14;loss+=Math.max(-change,0)/14;}
  else{gain=(gain*13+Math.max(change,0))/14;loss=(loss*13+Math.max(-change,0))/14;}
  if(i<51)continue;
  const window=bars.slice(i-51,i+1);
  if(window.some((b,j)=>j>0&&Date.parse(b.time)-Date.parse(window[j-1].time)!==7*DAY))continue;
  const average=window.reduce((sum,b)=>sum+b.close,0)/52,close=bars[i].close;
  const drawdown=(close/Math.max(...window.map(b=>b.high))-1)*100;
  const rsi=gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss);
  const multiplier:DcaMultiple=drawdown<=-30&&rsi<=35&&close<=average*.85?4:drawdown<=-15&&rsi<=45&&close<average?2:rsi>=70&&close>average*1.15?0:1;
  history.push({date:bars[i].sourceEndDate,close,average,drawdown,rsi,multiplier});
 }
 const last=history.at(-1);
 if(!last||last.date!==bars.at(-1)!.sourceEndDate)return unavailable('The latest 52-week window has gaps. No signal is inferred.');
 const multiple=options.thesisBroken?0:last.multiplier;
 return {multiplier:multiple as DcaMultiple|null,state:options.thesisBroken?'THESIS_REVIEW':'CONFIRMED',label:options.thesisBroken?'Review the thesis':multiple===4?'Deep pullback':multiple===2?'Pullback zone':multiple===0?'Extended price':'Steady accumulation',reason:options.thesisBroken?'A documented thesis break overrides the price signal.':multiple===4?'Price, drawdown and momentum meet the deep-pullback rules. Support is not confirmed.':multiple===2?'A pullback below the yearly average meets the measured accumulation rules.':multiple===0?'Price is stretched above its yearly average with elevated momentum.':'The weekly price signal is in its baseline zone.',observedAt:last.date,metrics:last as Observation|null,history:history.slice(-12)};
}
