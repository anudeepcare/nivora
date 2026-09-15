import {providerMarketHint} from "./v82/security-master";
import {AlpacaPaperBroker} from "../alpaca-paper";
// V9.9.8 normalizeAlpacaMarketPrice remains the trade-first semantic baseline;
// V9.9.8.1 additionally retains the fresh quote candidate instead of discarding it.
import {marketSessionAt,type MarketSession,type QuoteFreshness} from "../nivora-market-session";
import {normalizeTwelveQuote} from "../nivora-live-quote";
import {selectMarketDisplayQuote,marketPriceMaxAgeSeconds,type DisplaySession,type DisplayLabel,type MarketPriceCandidate} from "./market-price-authority";

export const MAX_REGULAR_RESEARCH_QUOTE_AGE_SECONDS=180;
export const MAX_RESEARCH_QUOTE_AGE_SECONDS=15*60;
export type ProviderDiagnostic={provider:string;status:"OK"|"RATE_LIMIT"|"TIMEOUT"|"UNAVAILABLE"|"STALE"|"ERROR";detail:string;price?:number|null;ageSeconds?:number|null;kind?:string};
export type FastResearchQuote={
 symbol:string;price:number;changePct:number|null;provider:"alpaca"|"twelvedata-price"|"coinbase";providerTimestamp:string|null;retrievedAt:string;latencyMs:number;
 ageSeconds:number|null;session:MarketSession|"CRYPTO_24X7";freshness:QuoteFreshness;researchOnly:true;executionVerified:false;
 providerAgreementPct?:number|null;label?:DisplayLabel;
 confidence?:"VERIFIED"|"SINGLE_SOURCE"|"CONTESTED";diagnostics?:ProviderDiagnostic[];
};
const finitePositive=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
export const normalizeCryptoSymbol=(s:string)=>String(s||"").toUpperCase().replace("-","/").replace(/^(BTC|ETH|SOL|DOGE|XRP|ADA|AVAX|LINK|LTC|BCH|DOT|MATIC|SHIB)$/, "$1/USD");
export const isCryptoSymbol=(s:string)=>/^(BTC|ETH|SOL|DOGE|XRP|ADA|AVAX|LINK|LTC|BCH|DOT|MATIC|SHIB)[\/-](USD|USDT)$/i.test(normalizeCryptoSymbol(s));
const age=(stamp:string|null,asOf:Date)=>stamp?Math.max(0,Math.round((asOf.getTime()-new Date(stamp).getTime())/1000)):null;
const classifyError=(e:any):ProviderDiagnostic["status"]=>{const m=String(e?.message||e||"");return /429|rate.?limit|credits|quota/i.test(m)?"RATE_LIMIT":/timeout|aborted/i.test(m)?"TIMEOUT":/stale/i.test(m)?"STALE":/unavailable|not configured/i.test(m)?"UNAVAILABLE":"ERROR"};
function providerTimestamp(body:any){const epoch=Number(body?.timestamp);return Number.isFinite(epoch)&&epoch>0?new Date(epoch*1000).toISOString():null}
function providerSession(body:any,fallback:DisplaySession,crypto=false):DisplaySession{
 if(crypto)return "CRYPTO_24X7";
 // AURYN exchange calendar owns PRE_MARKET / REGULAR / AFTER_HOURS.
 // Provider is_market_open commonly means regular session only and must never collapse
 // an active extended-hours session into CLOSED.
 if(fallback==="PRE_MARKET"||fallback==="AFTER_HOURS")return fallback;
 if(fallback==="CLOSED"||fallback==="OVERNIGHT")return fallback;
 if(body?.is_market_open===true&&fallback==="REGULAR")return "REGULAR";
 return fallback;
}
const sessionTradeMaxAge=(session:DisplaySession)=>marketPriceMaxAgeSeconds(session);
const sessionQuoteMaxAge=(session:DisplaySession)=>marketPriceMaxAgeSeconds(session);

async function fromTwelve(symbol:string,key:string,asOf:Date,crypto:boolean){
 if(!key)throw new Error("Twelve Data is not configured.");
 const hint=providerMarketHint(symbol),url=`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}${!crypto&&hint.exchange?`&exchange=${encodeURIComponent(hint.exchange)}`:""}${!crypto?"&interval=1min&prepost=true":""}&apikey=${key}`;
 const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(3500)}),body=await r.json().catch(()=>null);
 if(!r.ok||body?.status==="error")throw new Error(`${r.status} ${body?.message||"Twelve quote unavailable"}`);
 const normalized=normalizeTwelveQuote(body,asOf),price=finitePositive(normalized.price),stamp=normalized.providerTimestamp,a=age(stamp,asOf);
 if(price==null)throw new Error("Twelve quote has no usable current price");
 if(!stamp||a==null)throw new Error("Twelve quote has no timestamp");
 const fallback=(crypto?"CRYPTO_24X7":marketSessionAt(asOf)) as DisplaySession,session=providerSession(body,fallback,crypto);
 // normalizeTwelveQuote understands Twelve's split extended-hours payload:
 // close/timestamp = regular session, extended_price/extended_timestamp = current pre/post market.
 const kind:MarketPriceCandidate["kind"]="TRADE";
 const maxAge=normalized.isExtendedHours?sessionTradeMaxAge(session):sessionTradeMaxAge(session);
 const lastMarketCandidate={symbol,price,provider:"twelvedata-price",providerTimestamp:stamp,retrievedAt:asOf.toISOString(),session,freshness:a<=maxAge?"LIVE":"RECENT",kind} as MarketPriceCandidate;
 const candidate=a<=maxAge?lastMarketCandidate:null;
 return{candidate,lastMarketCandidate,changePct:normalized.changePct,normalized,extendedPrice:body?.extended_price??null,extendedTimestamp:body?.extended_timestamp??null};
}
async function fromTwelveIntradayLast(symbol:string,key:string,asOf:Date){
 if(!key)throw new Error("Twelve Data is not configured.");
 const hint=providerMarketHint(symbol),url=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1min&outputsize=3&timezone=UTC&prepost=true${hint.exchange?`&exchange=${encodeURIComponent(hint.exchange)}`:""}&apikey=${key}`;
 const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(3500)}),body=await r.json().catch(()=>null);
 if(!r.ok||body?.status==="error")throw new Error(`${r.status} ${body?.message||"Twelve intraday unavailable"}`);
 const row=Array.isArray(body?.values)?body.values[0]:null,price=finitePositive(row?.close),rawTime=String(row?.datetime||"");
 const stamp=rawTime?(rawTime.includes("T")?rawTime:rawTime.replace(" ","T")+"Z"):null,a=age(stamp,asOf),session=marketSessionAt(asOf) as DisplaySession;
 if(price==null||!stamp||a==null)throw new Error("Twelve intraday has no usable timestamped price");
 const candidate:MarketPriceCandidate={symbol,price,provider:"twelve-intraday",providerTimestamp:stamp,retrievedAt:asOf.toISOString(),session,freshness:a<=marketPriceMaxAgeSeconds(session)?"LIVE":"RECENT",kind:"TRADE"};
 return{candidate:a<=marketPriceMaxAgeSeconds(session)?candidate:null,lastMarketCandidate:candidate,changePct:null,intradayAgeSeconds:a};
}
async function fromFinnhub(symbol:string,key:string,asOf:Date){
 if(!key)throw new Error("Finnhub is not configured.");
 const url=`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
 const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(3000)}),body=await r.json().catch(()=>null);
 if(!r.ok)throw new Error(`${r.status} Finnhub quote unavailable`);
 const price=finitePositive(body?.c),stamp=Number.isFinite(Number(body?.t))&&Number(body.t)>0?new Date(Number(body.t)*1000).toISOString():null,a=age(stamp,asOf),session=marketSessionAt(asOf) as DisplaySession;
 if(price==null||!stamp||a==null)throw new Error("Finnhub quote has no usable timestamped price");
 const candidate:MarketPriceCandidate={symbol,price,provider:"finnhub",providerTimestamp:stamp,retrievedAt:asOf.toISOString(),session,freshness:a<=marketPriceMaxAgeSeconds(session)?"LIVE":"RECENT",kind:"TRADE"};
 return{candidate:a<=marketPriceMaxAgeSeconds(session)?candidate:null,lastMarketCandidate:candidate,changePct:Number.isFinite(Number(body?.dp))?Number(body.dp):null};
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
 const lastMarketCandidate=trade!=null&&tradeStamp&&tradeAge!=null&&tradeAge<=86400?{symbol,price:trade,provider:"alpaca",providerTimestamp:tradeStamp,retrievedAt:asOf.toISOString(),session,freshness:tradeAge<=sessionTradeMaxAge(session)?"LIVE":"RECENT",kind:"TRADE"} as MarketPriceCandidate:null;
 if(lastMarketCandidate&&tradeAge!<=sessionTradeMaxAge(session))candidates.push(lastMarketCandidate);
 // A fresh quote midpoint is valid market context when a less-active equity has no trade in the last 3m.
 // It is never treated as an executed trade and execution verification remains separate.
 if(quoteMid!=null&&quoteStamp&&quoteAge!=null&&quoteAge<=sessionQuoteMaxAge(session)){
   const sane=bid!=null&&ask!=null&&quoteMid>0?((ask-bid)/quoteMid*100)<=2:true;
   if(sane)candidates.push({symbol,price:quoteMid,provider:"alpaca-quote",providerTimestamp:quoteStamp,retrievedAt:asOf.toISOString(),session,freshness:"LIVE",kind:"QUOTE_MID"});
 }
 if(!candidates.length)throw new Error(`Alpaca trade/quote stale (trade ${tradeAge??"?"}s, quote ${quoteAge??"?"}s)`);
 return{candidates,lastMarketCandidate,changePct:null};
}

export async function loadFastResearchQuote(input:{symbol:string;twelveKey?:string;alpacaKey?:string;alpacaSecret?:string;finnhubKey?:string;asOf?:Date}):Promise<FastResearchQuote>{
 const rawSymbol=String(input.symbol||"").toUpperCase(),asOf=input.asOf??new Date(),started=Date.now(),crypto=isCryptoSymbol(rawSymbol),symbol=crypto?normalizeCryptoSymbol(rawSymbol):rawSymbol;if(!symbol)throw new Error("Symbol is required.");
 const jobs:{provider:string;run:()=>Promise<any>}[]=[];
 if(crypto)jobs.push({provider:"coinbase",run:()=>fromCoinbase(symbol,asOf)});
 if(!crypto&&input.alpacaKey&&input.alpacaSecret)jobs.push({provider:"alpaca",run:()=>fromAlpaca(symbol,input.alpacaKey!,input.alpacaSecret!,asOf)});
 if(input.twelveKey){jobs.push({provider:"twelvedata-price",run:()=>fromTwelve(symbol,input.twelveKey!,asOf,crypto)});if(!crypto)jobs.push({provider:"twelve-intraday",run:()=>fromTwelveIntradayLast(symbol,input.twelveKey!,asOf)});}if(input.finnhubKey&&!crypto)jobs.push({provider:"finnhub",run:()=>fromFinnhub(symbol,input.finnhubKey!,asOf)});
 if(!jobs.length)throw new Error("No fast market-data provider is configured.");
 const settled=await Promise.all(jobs.map(async j=>{try{return{provider:j.provider,ok:true,value:await j.run()}}catch(error:any){return{provider:j.provider,ok:false,error}}}));
 const diagnostics:ProviderDiagnostic[]=settled.map(x=>{if(!x.ok)return{provider:x.provider,status:classifyError((x as any).error),detail:String((x as any).error?.message||(x as any).error)};const v=(x as any).value,c=v.candidate??v.candidates?.[0]??v.lastMarketCandidate;return{provider:x.provider,status:"OK",detail:v.normalized?.isExtendedHours?(v.candidate?"fresh extended-hours market data available":"extended-hours observation outside freshness window"):(v.candidate?"fresh market data available":"market observation outside freshness window"),price:c?.price??null,ageSeconds:age(c?.providerTimestamp??null,asOf),kind:c?.kind??null}});
 const candidates:MarketPriceCandidate[]=[],changeByProvider=new Map<string,number|null>();
 for(const x of settled)if(x.ok){const v=(x as any).value;if(v.candidate)candidates.push(v.candidate);if(v.candidates)candidates.push(...v.candidates);if(v.lastMarketCandidate&&!candidates.some(c=>c.provider===v.lastMarketCandidate.provider&&c.providerTimestamp===v.lastMarketCandidate.providerTimestamp))candidates.push(v.lastMarketCandidate);changeByProvider.set(x.provider,v.changePct??null)}
 if(!candidates.length){const err=new Error("No usable market price. "+diagnostics.map(d=>`${d.provider}:${d.status}`).join(", "));(err as any).diagnostics=diagnostics;throw err}
 const session=(crypto?"CRYPTO_24X7":marketSessionAt(asOf)) as DisplaySession;
 // Prefer executed trades for cross-provider agreement. If only one provider is healthy, it is allowed to display.
 const trades=candidates.filter(c=>c.kind==="TRADE");
 // During PRE_MARKET / AFTER_HOURS, do not let a stale prior-session trade hide a fresh quote midpoint.
 // The authority function will independently reject stale candidates by timestamp/session.
 const activeSessionPool=(session==="PRE_MARKET"||session==="AFTER_HOURS")
   ?candidates.filter(c=>c.session===session&&(c.kind==="TRADE"||c.kind==="QUOTE_MID"))
   :trades.length?trades:candidates;
 const pool=activeSessionPool.length?activeSessionPool:candidates;
 const authority=selectMarketDisplayQuote({symbol,session,asOf:asOf.toISOString(),candidates:pool});
 if(authority.price==null){const err=new Error(`${authority.label}: ${authority.reason}`);(err as any).diagnostics=diagnostics;throw err}
 const chosen=pool.find(q=>q.provider===authority.source&&q.providerTimestamp===authority.asOf)??pool[0],baseProvider=chosen.provider.startsWith("alpaca")?"alpaca":chosen.provider==="coinbase"?"coinbase":"twelvedata-price";
 return{symbol,price:authority.price,changePct:changeByProvider.get(baseProvider)??null,provider:baseProvider as any,providerTimestamp:authority.asOf,retrievedAt:asOf.toISOString(),latencyMs:Math.max(0,Date.now()-started),ageSeconds:age(authority.asOf,asOf),session:session as any,freshness:"LIVE",researchOnly:true,executionVerified:false,providerAgreementPct:authority.providerAgreementPct,label:authority.label,confidence:authority.confidence,diagnostics};
}
