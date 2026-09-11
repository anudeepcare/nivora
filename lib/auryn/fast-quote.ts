import {providerMarketHint} from "./v82/security-master";
import {AlpacaPaperBroker} from "../alpaca-paper";
import {normalizeAlpacaQuote} from "../nivora-execution-quote";
import {marketSessionAt,quoteFreshness,type MarketSession,type QuoteFreshness} from "../nivora-market-session";

export const MAX_RESEARCH_QUOTE_AGE_SECONDS=15*60;

export type FastResearchQuote={
  symbol:string;price:number;changePct:number|null;
  provider:"alpaca"|"twelvedata-price";providerTimestamp:string|null;retrievedAt:string;latencyMs:number;
  ageSeconds:number|null;session:MarketSession;freshness:QuoteFreshness;
  researchOnly:true;executionVerified:false;
};
const finitePositive=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
export function assertResearchQuoteFresh(q:{price:number;providerTimestamp:string|null;ageSeconds:number|null;session:MarketSession;freshness:QuoteFreshness}){
 if(!Number.isFinite(q.price)||q.price<=0)throw new Error("Provider returned no usable price.");
 if(!q.providerTimestamp||q.ageSeconds==null)throw new Error("Provider quote has no verifiable timestamp.");
 if(q.ageSeconds>MAX_RESEARCH_QUOTE_AGE_SECONDS||q.freshness==="STALE")throw new Error(`Provider quote is stale (${q.ageSeconds}s).`);
 return q;
}
async function fromTwelve(symbol:string,key:string,asOf:Date):Promise<Omit<FastResearchQuote,"latencyMs">>{
 if(!key)throw new Error("Twelve Data is not configured.");
 const hint=providerMarketHint(symbol);
 // /quote is timestamped; /price is intentionally not used because an untimestamped number
 // cannot be called current after the regular session.
 const url=`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}${hint.exchange?`&exchange=${encodeURIComponent(hint.exchange)}`:""}&apikey=${key}`;
 const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(1300)});
 const body=await r.json().catch(()=>null);
 const price=finitePositive(body?.close??body?.price);
 if(!r.ok||body?.status==="error"||price==null)throw new Error(body?.message||`Twelve quote unavailable (${r.status})`);
 const epoch=Number(body?.timestamp),providerTimestamp=Number.isFinite(epoch)&&epoch>0?new Date(epoch*1000).toISOString():null;
 const ageSeconds=providerTimestamp?Math.max(0,Math.round((asOf.getTime()-new Date(providerTimestamp).getTime())/1000)):null;
 const session=marketSessionAt(asOf),freshness=quoteFreshness(ageSeconds??Infinity,session);
 const q={symbol,price,changePct:Number.isFinite(Number(body?.percent_change))?Number(body.percent_change):null,provider:"twelvedata-price" as const,providerTimestamp,retrievedAt:asOf.toISOString(),ageSeconds,session,freshness,researchOnly:true as const,executionVerified:false as const};
 assertResearchQuoteFresh(q);return q;
}
async function fromAlpaca(symbol:string,key:string,secret:string,asOf:Date):Promise<Omit<FastResearchQuote,"latencyMs">>{
 if(!key||!secret||symbol.includes("/"))throw new Error("Alpaca fast quote is unavailable.");
 const broker=new AlpacaPaperBroker(key,secret);const raw=await broker.getLatestExecutionQuote(symbol);
 const q=normalizeAlpacaQuote(symbol,raw.quote,raw.trade,asOf);const price=finitePositive(q.price);
 const out={symbol,price:price??0,changePct:q.changePct,provider:"alpaca" as const,providerTimestamp:q.providerTimestamp,retrievedAt:asOf.toISOString(),ageSeconds:q.ageSeconds,session:q.session,freshness:q.freshness,researchOnly:true as const,executionVerified:false as const};
 assertResearchQuoteFresh(out);return out;
}
export async function loadFastResearchQuote(input:{symbol:string;twelveKey?:string;alpacaKey?:string;alpacaSecret?:string;asOf?:Date}):Promise<FastResearchQuote>{
 const symbol=String(input.symbol||"").toUpperCase(),asOf=input.asOf??new Date(),started=Date.now();if(!symbol)throw new Error("Symbol is required.");
 const attempts:Promise<Omit<FastResearchQuote,"latencyMs">>[]=[];
 if(input.alpacaKey&&input.alpacaSecret&&!symbol.includes("/"))attempts.push(fromAlpaca(symbol,input.alpacaKey,input.alpacaSecret,asOf));
 if(input.twelveKey)attempts.push(fromTwelve(symbol,input.twelveKey,asOf));
 if(!attempts.length)throw new Error("No fast market-data provider is configured.");
 const quote=await Promise.any(attempts);return{...quote,latencyMs:Math.max(0,Date.now()-started)};
}
