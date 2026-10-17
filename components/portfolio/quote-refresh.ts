import {fetchQuotes,quoteRequests,QUOTE_REFRESH_LIMIT,QUOTE_REFRESH_MS,type QuoteRequest} from './quote-client';
import {nextQuoteRefresh} from './quote-status';

export function mergeQuoteResults(previous:Record<string,any>,incoming:Record<string,any>){
 const merged={...previous};
 for(const [symbol,quote] of Object.entries(incoming)){
  if(quote?.market?.displayPrice==null&&previous[symbol]?.market?.displayPrice!=null){
   merged[symbol]={...previous[symbol],...quote,market:previous[symbol].market,quoteRefreshError:quote?.quoteError||'No current quote returned. Last price retained with its original timestamp.'};
  }else merged[symbol]=quote;
 }
 return merged;
}

type RefreshState={loading:boolean;refreshing:boolean;error:string;lastCheckedAt:number|null};
export function createQuoteRefreshController(options:{
 requests:QuoteRequest[];getQuotes:()=>Record<string,any>;onQuotes:(quotes:Record<string,any>)=>void;onState:(state:RefreshState)=>void;
 isVisible?:()=>boolean;now?:()=>number;fetcher?:typeof fetchQuotes;setTimer?:(callback:()=>void,delay:number)=>any;clearTimer?:(timer:any)=>void;
}){
 const requests=quoteRequests(options.requests),symbols=[...new Set(requests.map(x=>x.symbol))],now=options.now||Date.now;
 const fetcher=options.fetcher||fetchQuotes,setTimer=options.setTimer||setTimeout,clearTimer=options.clearTimer||clearTimeout;
 let disposed=false,pending=false,first=true,cursor=0,lastAttempt=-Infinity,timer:any=null,lastCheckedAt:number|null=null;
 const abort=new AbortController();
 const schedule=()=>{if(timer!=null)clearTimer(timer);if(!disposed)timer=setTimer(()=>{void run(false)},QUOTE_REFRESH_MS);};
 async function run(all:boolean){
  if(disposed||pending)return false;
  if(!symbols.length){options.onState({loading:false,refreshing:false,error:'',lastCheckedAt});return false;}
  if(options.isVisible?.()===false||now()-lastAttempt<QUOTE_REFRESH_MS){schedule();return false;}
  const next=first||all?{symbols,cursor}:nextQuoteRefresh(symbols,options.getQuotes(),cursor,now(),QUOTE_REFRESH_LIMIT);
  cursor=next.cursor;if(!next.symbols.length){schedule();return false;}
  const selected=new Set(next.symbols),batch=options.requests.filter((_,i)=>selected.has(quoteRequests([options.requests[i]])[0]?.symbol));
  pending=true;lastAttempt=now();options.onState({loading:first,refreshing:true,error:'',lastCheckedAt});
  let error='';
  try{
   const result=await fetcher(batch,{signal:abort.signal});
   if(disposed)return false;
   options.onQuotes(result);lastCheckedAt=now();
   const unavailable=next.symbols.filter(symbol=>result[symbol]?.market?.displayPrice==null);
   if(unavailable.length)error=`Current prices unavailable for ${unavailable.join(', ')}. Any retained prices keep their original timestamps.`;
  }catch(e:any){if(!disposed)error=e?.message||'Quote refresh unavailable.';}
  finally{
   pending=false;first=false;
   if(!disposed){options.onState({loading:false,refreshing:false,error,lastCheckedAt});schedule();}
  }
  return true;
 }
 return{wake:()=>run(false),refresh:()=>run(true),dispose:()=>{disposed=true;abort.abort();if(timer!=null)clearTimer(timer);}};
}
