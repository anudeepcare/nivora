import {providerMarketHint} from "./v82/security-master";
import {AlpacaPaperBroker} from "../alpaca-paper";
import {normalizeAlpacaQuote} from "../nivora-execution-quote";

export type FastResearchQuote={
  symbol:string;
  price:number;
  changePct:number|null;
  provider:"alpaca"|"twelvedata-price";
  providerTimestamp:string|null;
  retrievedAt:string;
  latencyMs:number;
  researchOnly:true;
  executionVerified:false;
};

const finitePositive=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};

async function fromTwelve(symbol:string,key:string,asOf:Date):Promise<Omit<FastResearchQuote,"latencyMs">>{
  if(!key)throw new Error("Twelve Data is not configured.");
  const hint=providerMarketHint(symbol);
  const url=`https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}${hint.exchange?`&exchange=${encodeURIComponent(hint.exchange)}`:""}&apikey=${key}`;
  const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(1000)});
  const body=await r.json().catch(()=>null);
  const price=finitePositive(body?.price);
  if(!r.ok||body?.status==="error"||price==null)throw new Error(body?.message||`Twelve fast quote unavailable (${r.status})`);
  return{symbol,price,changePct:null,provider:"twelvedata-price",providerTimestamp:null,retrievedAt:asOf.toISOString(),researchOnly:true,executionVerified:false};
}

async function fromAlpaca(symbol:string,key:string,secret:string,asOf:Date):Promise<Omit<FastResearchQuote,"latencyMs">>{
  if(!key||!secret||symbol.includes("/"))throw new Error("Alpaca fast quote is unavailable.");
  const broker=new AlpacaPaperBroker(key,secret);
  const raw=await broker.getLatestExecutionQuote(symbol);
  const q=normalizeAlpacaQuote(symbol,raw.quote,raw.trade,asOf);
  const price=finitePositive(q.price);
  if(price==null)throw new Error("Alpaca returned no usable price.");
  return{symbol,price,changePct:q.changePct,provider:"alpaca",providerTimestamp:q.providerTimestamp,retrievedAt:asOf.toISOString(),researchOnly:true,executionVerified:false};
}

export async function loadFastResearchQuote(input:{symbol:string;twelveKey?:string;alpacaKey?:string;alpacaSecret?:string;asOf?:Date}):Promise<FastResearchQuote>{
  const symbol=String(input.symbol||"").toUpperCase(),asOf=input.asOf??new Date(),started=Date.now();
  if(!symbol)throw new Error("Symbol is required.");
  const attempts:Promise<Omit<FastResearchQuote,"latencyMs">>[]=[];
  if(input.alpacaKey&&input.alpacaSecret&&!symbol.includes("/"))attempts.push(fromAlpaca(symbol,input.alpacaKey,input.alpacaSecret,asOf));
  if(input.twelveKey)attempts.push(fromTwelve(symbol,input.twelveKey,asOf));
  if(!attempts.length)throw new Error("No fast market-data provider is configured.");
  const quote=await Promise.any(attempts);
  return{...quote,latencyMs:Math.max(0,Date.now()-started)};
}
