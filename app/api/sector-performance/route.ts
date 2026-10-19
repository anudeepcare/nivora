import {account,failure,limit,privateJson} from '@/lib/server';
import {marketHistory} from '@/lib/providers';
import {sectorBenchmarks,sectorReturns} from '@/lib/sector-performance';
export const maxDuration=60;
export async function GET(request:Request){try{
 const {user}=await account(request);limit(`sectors:${user.id}`,4);
 const benchmark=(await marketHistory('SPY','1Y')).candles;
 const rows:unknown[]=[];let index=0;
 await Promise.all(Array.from({length:3},async()=>{while(index<sectorBenchmarks.length){const [symbol,name]=sectorBenchmarks[index++];try{const series=(await marketHistory(symbol,'1Y')).candles;rows.push({symbol,name,...sectorReturns(series,benchmark)});}catch{rows.push({symbol,name,error:'Benchmark history unavailable',asOf:null,periods:{}});}}}));
 return privateJson({rows,benchmark:'SPY',asOf:sectorReturns(benchmark,benchmark).asOf});
}catch(e){return failure(e);}}
