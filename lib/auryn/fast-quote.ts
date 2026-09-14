import {providerMarketHint} from "./v82/security-master";
import {AlpacaPaperBroker} from "../alpaca-paper";
// V9.9.8 normalizeAlpacaMarketPrice remains the trade-first semantic baseline;
// V9.9.8.1 additionally retains the fresh quote candidate instead of discarding it.
import {marketSessionAt,type MarketSession,type QuoteFreshness} from "../nivora-market-session";
import {selectMarketDisplayQuote,type DisplaySession,type MarketPriceCandidate} from "./market-price-authority";

export const MAX_REGULAR_RESEARCH_QUOTE_AGE_SECONDS=180;
export const MAX_RESEARCH_QUOTE_AGE_SECONDS=15*60;
export type ProviderDiagnostic={provider:string;status:"OK"|"RATE_LIMIT"|"TIMEOUT"|"UNAVAILABLE"|"STALE"|"ERROR";detail:string;price?:number|null;ageSeconds?:number|null;kind?:string};
export type FastResearchQuote={
 symbol:string;price:number;changePct:number|null;provider:"alpaca"|"twelvedata-price"|"coinbase";providerTimestamp:string|null;retrievedAt:string;latencyMs:number;
 ageSeconds:number|null;session:MarketSession|"CRYPTO_24X7";freshness:QuoteFreshness;researchOnly:true;executionVerified:false;
 providerAgreementPct?:number|null;label?:"PRE-MARKET PRICE"|"LIVE MARKET PRICE"|"AFTER-HOURS PRICE"|"LAST OFFICIAL CLOSE"|"PRICE VERIFYING";
 confidence?:"VERIFIED"|"SINGLE_SOURCE"|"CONTESTED";diagnostics?:ProviderDiagnostic[];
};
const finitePositive=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
export const normalizeCryptoSymbol=(s:string)=>String(s||"").toUpperCase().replace("-","/").replace(/^(BTC|ETH|SOL|DOGE|XRP|ADA|AVAX|LINK|LTC|BCH|DOT|MATIC|SHIB)$/, "$1/USD");
export const isCryptoSymbol=(s:string)=>/^(BTC|ETH|SOL|DOGE|XRP|ADA|AVAX|LINK|LTC|BCH|DOT|MATIC|SHIB)[\/-](USD|USDT)$/i.test(normalizeCryptoSymbol(s));
const age=(stamp:string|null,asOf:Date)=>stamp?Math.max(0,Math.round((asOf.getTime()-new Date(stamp).getTime())/1000)):null;
const classifyError=(e:any):ProviderDiagnostic["status"]=>{const m=String(e?.message||e||"");return /429|rate.?limit|credits|quota/i.test(m)?"RATE_LIMIT":/timeout|aborted/i.test(m)?"TIMEOUT":/stale/i.test(m)?"STALE":/unavailable|not configured/i.test(m)?"UNAVAILABLE":"ERROR"};
function providerTimestamp(body:any){const epoch=Number(body?.timestamp);return Number.isFinite(epoch)&&epoch>0?new Date(epoch*1000).toISOString():null}

async function fromTwelve(symbol:string,key:string,asOf:Date,crypto:boolean){
 if(!key)throw new Error("Twelve Data is not configured.");
 const hint=providerMarketHint(symbol),url=`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}${!crypto&&hint.exchange?`&exchange=${encodeURIComponent(hint.exchange)}`:""}&apikey=${key}`;
 const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(3500)}),body=await r.json().catch(()=>null),price=finitePositive(body?.close??body?.price);
 if(!r.ok||body?.status==="error"||price==null)throw new Error(`${r.status} ${body?.message||"Twelve quote unavailable"}`);
 const stamp=providerTimestamp(body),a=age(stamp,asOf),session=(crypto?"CRYPTO_24X7":marketSessionAt(asOf)) as DisplaySession;
 if(!stamp||a==null||a>(crypto?300:session==="REGULAR"?180:900))throw new Error(`Twelve quote stale (${a??"unknown"}s)`);
 return{candidate:{symbol,price,provider:"twelvedata-price",providerTimestamp:stamp,retrievedAt:asOf.toISOString(),session,freshness:"LIVE",kind:"TRADE"} as MarketPriceCandidate,changePct:Number.isFinite(Number(body?.percent_change))?Number(body.percent_change):null};
}


async function fromCoinbase(symbol:string,asOf:Date){
 const normalized=normalizeCryptoSymbol(symbol),[base,quote]=normalized.split("/"),product=`${base}-${quote==="USDT"?"USD":quote}`;
 const r=await fetch(`https://api.exchange.coinbase.com/products/${encodeURIComponent(product)}/ticker`,{cache:"no-store",headers:{"Accept":"application/json"},signal:AbortSignal.timeout(3500)});
 const body=await r.json().catch(()=>null),price=finitePositive(body?.price);
 if(!r.ok||price==null)throw new Error(`${r.status} ${body?.message||"Coinbase ticker unavailable"}`);
 // Coinbase ticker is the response's current market state but does not guarantee a provider timestamp.
 // For display-only crypto authority we use a fresh retrieval-timestamp; execution remains separately verified.
 const stamp=asOf.toISOString();
 return{candidate:{symbol,price,provider:"coinbase",providerTimestamp:stamp,retrievedAt:stamp,session:"CRYPTO_24X7",freshness:"LIVE",kind:"TRADE"} as MarketPriceCandidate,changePct:null};
}

async function fromAlpaca(symbol:string,key:string,secret:string,asOf:Date){
 if(!key||!secret)throw new Error("Alpaca fast quote is unavailable.");
 const broker=new AlpacaPaperBroker(key,secret),raw=await broker.getLatestExecutionQuote(symbol),q=raw?.quote?.quote||raw?.quote||{},t=raw?.trade?.trade||raw?.trade||{};
 const trade=finitePositive(t.p??t.price),bid=finitePositive(q.bp??q.bid_price),ask=finitePositive(q.ap??q.ask_price),quoteMid=bid!=null&&ask!=null?(bid+ask)/2:ask??bid;
 const tradeStamp=String(t.t??t.timestamp??"")||null,quoteStamp=String(q.t??q.timestamp??"")||null,session=marketSessionAt(asOf) as DisplaySession,candidates:MarketPriceCandidate[]=[];
 const tradeAge=age(tradeStamp,asOf),quoteAge=age(quoteStamp,asOf);
 if(trade!=null&&tradeStamp&&tradeAge!=null&&tradeAge<=180)candidates.push({symbol,price:trade,provider:"alpaca",providerTimestamp:tradeStamp,retrievedAt:asOf.toISOString(),session,freshness:"LIVE",kind:"TRADE"});
 // A fresh quote midpoint is valid market context when a less-active equity has no trade in the last 3m.
 // It is never treated as an executed trade and execution verification remains separate.
 if(quoteMid!=null&&quoteStamp&&quoteAge!=null&&quoteAge<=90){
   const sane=bid!=null&&ask!=null&&quoteMid>0?((ask-bid)/quoteMid*100)<=2:true;
   if(sane)candidates.push({symbol,price:quoteMid,provider:"alpaca-quote",providerTimestamp:quoteStamp,retrievedAt:asOf.toISOString(),session,freshness:"LIVE",kind:"QUOTE_MID"});
 }
 if(!candidates.length)throw new Error(`Alpaca trade/quote stale (trade ${tradeAge??"?"}s, quote ${quoteAge??"?"}s)`);
 return{candidates,changePct:null};
}

export async function loadFastResearchQuote(input:{symbol:string;twelveKey?:string;alpacaKey?:string;alpacaSecret?:string;asOf?:Date}):Promise<FastResearchQuote>{
 const rawSymbol=String(input.symbol||"").toUpperCase(),asOf=input.asOf??new Date(),started=Date.now(),crypto=isCryptoSymbol(rawSymbol),symbol=crypto?normalizeCryptoSymbol(rawSymbol):rawSymbol;if(!symbol)throw new Error("Symbol is required.");
 const jobs:{provider:string;run:()=>Promise<any>}[]=[];
 if(crypto)jobs.push({provider:"coinbase",run:()=>fromCoinbase(symbol,asOf)});
 if(!crypto&&input.alpacaKey&&input.alpacaSecret)jobs.push({provider:"alpaca",run:()=>fromAlpaca(symbol,input.alpacaKey!,input.alpacaSecret!,asOf)});
 if(input.twelveKey)jobs.push({provider:"twelvedata-price",run:()=>fromTwelve(symbol,input.twelveKey!,asOf,crypto)});
 if(!jobs.length)throw new Error("No fast market-data provider is configured.");
 const settled=await Promise.all(jobs.map(async j=>{try{return{provider:j.provider,ok:true,value:await j.run()}}catch(error:any){return{provider:j.provider,ok:false,error}}}));
 const diagnostics:ProviderDiagnostic[]=settled.map(x=>x.ok?{provider:x.provider,status:"OK",detail:"fresh market data available"}:{provider:x.provider,status:classifyError((x as any).error),detail:String((x as any).error?.message||(x as any).error)});
 const candidates:MarketPriceCandidate[]=[],changeByProvider=new Map<string,number|null>();
 for(const x of settled)if(x.ok){const v=(x as any).value;if(v.candidate)candidates.push(v.candidate);if(v.candidates)candidates.push(...v.candidates);changeByProvider.set(x.provider,v.changePct??null)}
 if(!candidates.length){const err=new Error("No usable market price. "+diagnostics.map(d=>`${d.provider}:${d.status}`).join(", "));(err as any).diagnostics=diagnostics;throw err}
 const session=(crypto?"CRYPTO_24X7":marketSessionAt(asOf)) as DisplaySession;
 // Prefer executed trades for cross-provider agreement. If only one provider is healthy, it is allowed to display.
 const trades=candidates.filter(c=>c.kind==="TRADE"),pool=trades.length?trades:candidates;
 const authority=selectMarketDisplayQuote({symbol,session,asOf:asOf.toISOString(),candidates:pool});
 if(authority.price==null){const err=new Error(`${authority.label}: ${authority.reason}`);(err as any).diagnostics=diagnostics;throw err}
 const chosen=pool.find(q=>q.provider===authority.source&&q.providerTimestamp===authority.asOf)??pool[0],baseProvider=chosen.provider.startsWith("alpaca")?"alpaca":chosen.provider==="coinbase"?"coinbase":"twelvedata-price";
 return{symbol,price:authority.price,changePct:changeByProvider.get(baseProvider)??null,provider:baseProvider as any,providerTimestamp:authority.asOf,retrievedAt:asOf.toISOString(),latencyMs:Math.max(0,Date.now()-started),ageSeconds:age(authority.asOf,asOf),session:session as any,freshness:"LIVE",researchOnly:true,executionVerified:false,providerAgreementPct:authority.providerAgreementPct,label:authority.label,confidence:authority.confidence,diagnostics};
}
