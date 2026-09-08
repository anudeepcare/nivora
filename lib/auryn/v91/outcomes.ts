import type {ForwardOutcome,HistoricalBar} from './domain';
import type {ResearchHorizon} from '../v9/domain';
export const HORIZON_SESSIONS:Record<ResearchHorizon,number>={'1D':1,'5D':5,'20D':20,'90D':63,'180D':126,'1Y':252};
const round=(x:number,d=6)=>+x.toFixed(d);

export function labelForwardOutcome(
 bars:HistoricalBar[],benchmarkBars:HistoricalBar[],asOfIndex:number,horizon:ResearchHorizon,
 options:{sessionsOverride?:number;delistingReturnPct?:number|null}={}
):ForwardOutcome|null{
 if(asOfIndex<0||asOfIndex>=bars.length)return null;
 const entry=bars[asOfIndex];
 if(!entry||!Number.isFinite(entry.close)||entry.close<=0)return null;
 const sessions=Math.max(1,Math.floor(options.sessionsOverride??HORIZON_SESSIONS[horizon]));
 const benchStart=benchmarkBars.findIndex(b=>b.date===entry.date);
 if(benchStart<0||benchStart+sessions>=benchmarkBars.length)return null;
 const normalExit=asOfIndex+sessions;
 let exitPrice:number;
 let path:HistoricalBar[];
 if(normalExit<bars.length){
   exitPrice=bars[normalExit].close;
   path=bars.slice(asOfIndex+1,normalExit+1);
 }else if(Number.isFinite(options.delistingReturnPct)&&bars.length>asOfIndex){
   const last=bars[bars.length-1];
   exitPrice=last.close*(1+(options.delistingReturnPct as number)/100);
   path=bars.slice(asOfIndex+1);
 }else return null;
 const benchEntry=benchmarkBars[benchStart].close,benchExit=benchmarkBars[benchStart+sessions].close;
 if(!Number.isFinite(exitPrice)||exitPrice<=0||!Number.isFinite(benchEntry)||benchEntry<=0||!Number.isFinite(benchExit)||benchExit<=0)return null;
 const prices=path.map(b=>b.close).filter(x=>Number.isFinite(x)&&x>0);
 if(normalExit>=bars.length&&Number.isFinite(options.delistingReturnPct))prices.push(exitPrice);
 const maxDrawdownPct=prices.length?Math.min(0,...prices.map(p=>(p/entry.close-1)*100)):0;
 return{horizon,sessions,forwardReturnPct:round((exitPrice/entry.close-1)*100),benchmarkReturnPct:round((benchExit/benchEntry-1)*100),maxDrawdownPct:round(maxDrawdownPct)};
}
