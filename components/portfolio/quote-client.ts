import {normalizeQuoteSymbol} from '../../lib/auryn/quote-symbol';
export type QuoteRequest=string|{symbol:string;assetType?:string};
export const QUOTE_BATCH_SIZE=10;
export const QUOTE_REFRESH_MS=60_000;
export const QUOTE_REFRESH_LIMIT=6;
export function quoteRequests(symbols:QuoteRequest[]){return symbols.map(value=>({original:typeof value==='string'?value:value.symbol,symbol:normalizeQuoteSymbol(typeof value==='string'?value:value.symbol,typeof value==='string'?undefined:value.assetType)})).filter(x=>x.symbol);}

/** Serial small batches cover every holding and retain successes when another batch fails. */
export async function fetchQuotes(symbols:QuoteRequest[],options:{signal?:AbortSignal;onProgress?:(quotes:Record<string,any>)=>void}={}){
 const requests=quoteRequests(symbols),unique=[...new Set(requests.map(x=>x.symbol))],result:Record<string,any>={};
 for(let i=0;i<unique.length;i+=QUOTE_BATCH_SIZE){
  const batch=unique.slice(i,i+QUOTE_BATCH_SIZE);
  try{
   const r=await fetch(`/api/canonical?symbols=${encodeURIComponent(batch.join(','))}`,{cache:'no-store',signal:options.signal});
   const j=await r.json();if(!r.ok)throw new Error(j.error||`Quotes unavailable (${r.status})`);
   for(const item of Array.isArray(j.items)?j.items:[]){const symbol=normalizeQuoteSymbol(item?.security?.symbol||'');if(batch.includes(symbol))result[symbol]=item;}
   for(const symbol of batch)if(!result[symbol])result[symbol]={security:{symbol},market:null,quoteError:'Quote unavailable: provider returned no snapshot.'};
  }catch(error:any){
   if(options.signal?.aborted||error?.name==='AbortError')throw error;
   for(const symbol of batch)result[symbol]={security:{symbol},market:null,quoteError:error?.message||'Quote unavailable.'};
  }
  for(const item of requests)if(result[item.symbol])result[item.original]=result[item.symbol];
  options.onProgress?.({...result});
 }
 return result;
}
