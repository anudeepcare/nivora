import type {Candle} from './types';
export const sectorBenchmarks=[['XLK','Technology'],['XLF','Financials'],['XLV','Health care'],['XLY','Consumer discretionary'],['XLP','Consumer staples'],['XLE','Energy'],['XLI','Industrials'],['XLB','Materials'],['XLU','Utilities'],['XLRE','Real estate'],['XLC','Communication services']] as const;
export const sectorPeriods={ '1W':5,'1M':21,'3M':63,'1Y':252 } as const;
export function sectorReturns(series:Candle[],benchmark:Candle[]){
 const clean=(x:Candle[])=>x.filter(r=>Number.isFinite(r.close)&&r.close>0&&/^\d{4}-\d{2}-\d{2}$/.test(r.time)).sort((a,b)=>a.time.localeCompare(b.time));
 const market=clean(benchmark),prices=new Map(clean(series).map(r=>[r.time,r.close])),last=market.at(-1);
 const results=Object.fromEntries(Object.entries(sectorPeriods).map(([period,sessions])=>{
  const first=market.at(-1-sessions),end=last?prices.get(last.time):undefined,start=first?prices.get(first.time):undefined;
  if(!first||!last||end==null||start==null)return [period,{change:null,relative:null,start:null,end:last?.time??null}];
  const change=(end/start-1)*100,base=(last.close/first.close-1)*100;
  return [period,{change,relative:change-base,start:first.time,end:last.time}];
 }));return {asOf:last?.time??null,periods:results};
}
