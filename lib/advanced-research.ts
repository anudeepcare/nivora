import type {Candle} from './types';
const mean=(a:number[])=>a.length?a.reduce((s,n)=>s+n,0)/a.length:null;
/** Uses completed calendar-date OHLC observations, not intraday or today's forming bar. */
export function advancedStudies(input:Candle[],asOf:string){
 const bars=[...new Map(input.filter(b=>/^\d{4}-\d{2}-\d{2}$/.test(b.time)&&b.time<asOf.slice(0,10)&&[b.open,b.high,b.low,b.close].every(Number.isFinite)&&b.low>0&&b.high>=Math.max(b.open,b.close,b.low)&&b.low<=Math.min(b.open,b.close)).map(b=>[b.time,b])).values()].sort((a,b)=>a.time.localeCompare(b.time));
 const n=bars.length,last=bars.at(-1),closes=bars.map(b=>b.close),window=bars.slice(-63),returns=closes.slice(1).map((v,i)=>v/closes[i]-1);
 const tr=bars.slice(1).map((b,i)=>Math.max(b.high-b.low,Math.abs(b.high-bars[i].close),Math.abs(b.low-bars[i].close)));
 const atr=n>=15?mean(tr.slice(-14)):null; // simple mean TR, not Wilder smoothing
 const recent=closes.slice(-20),mid=recent.length===20?mean(recent):null,sigma=mid==null?null:Math.sqrt(recent.reduce((s,v)=>s+(v-mid)**2,0)/20);
 const volumes=bars.slice(-21,-1),volumeReady=volumes.length===20&&volumes.every(b=>Number.isFinite(b.volume)&&b.volume>0)&&!!last&&Number.isFinite(last.volume)&&last.volume>0,averageVolume=volumeReady?mean(volumes.map(b=>b.volume)):null;
 const gaps=bars.slice(1).map((b,i)=>(b.open/bars[i].close-1)*100);
 const downside=returns.length>=60?Math.sqrt(returns.reduce((s,v)=>s+Math.min(v,0)**2,0)/returns.length):null;
 const low=window.length?window.reduce((a,b)=>b.low<a.low?b:a):null,high=window.length?window.reduce((a,b)=>b.high>a.high?b:a):null;
 const fib=window.length>=20&&low&&high&&high.high>low.low&&low.time!==high.time?{low:low.low,high:high.high,lowDate:low.time,highDate:high.time,direction:low.time<high.time?'up':'down',levels:[0,.236,.382,.5,.618,.786,1].map(ratio=>({ratio,price:low.time<high.time?high.high-(high.high-low.low)*ratio:low.low+(high.high-low.low)*ratio}))}:null;
 const anchor=low?window.findIndex(b=>b.time===low.time):-1,anchored=window.slice(anchor),vwap=anchor>=0&&anchored.length>=5&&anchored.every(b=>Number.isFinite(b.volume)&&b.volume>0)?anchored.reduce((s,b)=>s+(b.high+b.low+b.close)/3*b.volume,0)/anchored.reduce((s,b)=>s+b.volume,0):null;
 return {count:n,asOf:last?.time??null,last:last?.close??null,atr,atrPct:atr!=null&&last?atr/last.close*100:null,roc20:n>=21?(closes[n-1]/closes[n-21]-1)*100:null,roc60:n>=61?(closes[n-1]/closes[n-61]-1)*100:null,relativeVolume:averageVolume&&last?last.volume/averageVolume:null,averageDollarVolume:volumeReady?mean(volumes.map(b=>b.close*b.volume)):null,bandwidth:mid&&sigma!=null?4*sigma/mid*100:null,largestGap:gaps.length>=20?Math.max(...gaps.map(Math.abs)):null,downsideDaily:downside==null?null:downside*100,vwap,anchorDate:low?.time??null,fib};
}
/** Long-only hypothetical plan. Stops can gap; planned loss is not a guaranteed maximum. */
export function tradePlan(capital:number,riskPct:number,entry:number,stop:number,target:number,slippagePct:number){
 if(![capital,riskPct,entry,stop,target,slippagePct].every(Number.isFinite)||capital<=0||riskPct<=0||riskPct>10||stop<=0||entry<=stop||target<=entry||slippagePct<0||slippagePct>5)return {valid:false as const};
 const entryCost=entry*(1+slippagePct/100),stopFill=stop*(1-slippagePct/100),targetFill=target*(1-slippagePct/100),unitRisk=entryCost-stopFill,budget=capital*riskPct/100,quantity=Math.floor(Math.min(budget/unitRisk,capital/entryCost));
 return {valid:true as const,quantity,budget,plannedLoss:quantity*unitRisk,capitalUsed:quantity*entryCost,rewardRisk:(targetFill-entryCost)/unitRisk,plannedProfit:quantity*(targetFill-entryCost)};
}
