import {fetchQuotes,quoteRequests,type QuoteRequest} from './quote-client';
// Public market snapshots only. Account positions and balances never enter this cache.
const cache=new Map<string,{quote:any;checkedAt:number}>();
const TTL=60_000,RETAIN=10*60_000;
export function cachedPortfolioQuotes(requests:QuoteRequest[],now=Date.now()){
 const result:Record<string,any>={};
 for(const {original,symbol} of quoteRequests(requests)){const item=cache.get(symbol);if(item&&now-item.checkedAt<RETAIN)result[original]=item.quote;}
 return result;
}
export async function fetchCachedPortfolioQuotes(requests:QuoteRequest[],options:Parameters<typeof fetchQuotes>[1]={}){
 const now=Date.now(),missing=requests.filter(r=>{const key=quoteRequests([r])[0]?.symbol,item=cache.get(key);return !item||now-item.checkedAt>=TTL;});
 if(missing.length){const fresh=await fetchQuotes(missing,options);if(options.signal?.aborted)return{};for(const {original,symbol} of quoteRequests(missing))if(fresh[original]){
  const prior=cache.get(symbol),quote=fresh[original];
  // A failed refresh keeps the original observation and exposes the failure.
  cache.set(symbol,{quote:quote.market?.displayPrice==null&&prior?.quote?.market?.displayPrice!=null?{...prior.quote,quoteRefreshError:quote.quoteError}:quote,checkedAt:Date.now()});
 }while(cache.size>300)cache.delete(cache.keys().next().value!);}
 return cachedPortfolioQuotes(requests);
}
