import {isCryptoQuoteSymbol,normalizeQuoteSymbol} from './quote-symbol';

export const CRYPTO_QUOTE_MAX_AGE_SECONDS=300;

/**
 * Coinbase's ticker price is its last trade, whose `time` is required.
 * https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker
 * A retrieval timestamp is never a substitute for that trade's timestamp.
 * This is portfolio/research display authority only; execution stays blocked.
 */
export function buildCanonicalCryptoSnapshot(symbolRaw:string,raw:any,asOf=new Date()){
 const symbol=normalizeQuoteSymbol(symbolRaw),currency=symbol.split('/')[1]||null;
 const numeric=typeof raw?.price==='string'||typeof raw?.price==='number'?Number(raw.price):NaN;
 const price=Number.isFinite(numeric)&&numeric>0?numeric:null;
 const stamp=typeof raw?.time==='string'&&/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(raw.time)?raw.time:null;
 const time=stamp?Date.parse(stamp):NaN,age=Number.isFinite(time)?(asOf.getTime()-time)/1000:null;
 const validTime=age!=null&&age>=0,live=isCryptoQuoteSymbol(symbol)&&price!=null&&validTime&&age!<=CRYPTO_QUOTE_MAX_AGE_SECONDS;
 const accepted=live?price:null,acceptedTime=live?stamp:null;
 const reason=live?'One timestamped crypto market source is available; display only, execution remains blocked.':price==null?'Crypto quote unavailable.':!validTime?'Crypto price timestamp is missing, invalid, or in the future.':'Crypto trade is stale; waiting for a recent timestamped price.';
 return{snapshotId:`crypto-${symbol}-${stamp||'unavailable'}`,symbol,currency,asOf:asOf.toISOString(),session:'CRYPTO_24X7',calendarState:'OPEN',
  priceState:live?'LIVE_SINGLE_SOURCE':'UNAVAILABLE',displayPrice:accepted,decisionPrice:accepted,decisionPriceAsOf:acceptedTime,decisionPriceRole:live?'LIVE_MARKET':'NONE',
  liveMarketPrice:accepted,liveMarketPriceAsOf:acceptedTime,regularClose:null,regularClosePrice:null,regularCloseAsOf:null,extendedPrice:null,
  executionPrice:null,executionPriceAsOf:null,executionTradable:false,priceSensitiveAllowed:live,decisionAllowed:live,priceUse:live?'RESEARCH_LIVE_SINGLE_SOURCE':'BLOCKED',
  providerAgreementPct:null,contextProviderGapPct:null,
  sources:price!=null?[{provider:'coinbase',price,providerTimestamp:validTime?stamp:null,ageSeconds:validTime?age:null,freshness:live?'LIVE':'STALE'}]:[],reason};
}

export async function loadCanonicalCryptoSnapshot(symbolRaw:string,asOf?:Date,fetcher:typeof fetch=fetch){
 const symbol=normalizeQuoteSymbol(symbolRaw);
 if(!isCryptoQuoteSymbol(symbol))return buildCanonicalCryptoSnapshot(symbol,null,asOf);
 try{
  // Preserve USD vs USDT/USDC/EUR: a different quote currency is not an FX conversion.
  const response=await fetcher(`https://api.exchange.coinbase.com/products/${encodeURIComponent(symbol.replace('/','-'))}/ticker`,{cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
  const body=await response.json();return buildCanonicalCryptoSnapshot(symbol,response.ok?body:null,asOf);
 }catch{return buildCanonicalCryptoSnapshot(symbol,null,asOf);}
}
