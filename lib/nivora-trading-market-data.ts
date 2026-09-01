
import type {AlpacaPaperBroker} from "./alpaca-paper";
import {normalizeAlpacaQuote,normalizeTwelveExecutionQuote,type ExecutionQuote} from "./nivora-execution-quote";
import {assessQuoteIntegrity,type QuoteIntegrity} from "./nivora-provider-consensus";

async function fetchTwelveRaw(symbol:string,key:string){
 const u=`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&prepost=true&apikey=${key}`;
 const r=await fetch(u,{cache:"no-store",signal:AbortSignal.timeout(4500)});
 const body=await r.json().catch(()=>null);
 if(!r.ok||body?.status==="error"||(!body?.close&&!body?.price))throw new Error(body?.message||`Twelve Data ${r.status}`);
 return body;
}

export type TradingMarketDataResult={
 integrity:QuoteIntegrity;
 alpaca:ExecutionQuote|null;
 twelve:ExecutionQuote|null;
 twelveRaw:any|null;
};

export async function loadTradingMarketData(symbol:string,broker:AlpacaPaperBroker|null,twelveKey:string,asOf=new Date()):Promise<TradingMarketDataResult>{
 let alpaca:ExecutionQuote|null=null,twelve:ExecutionQuote|null=null,twelveRaw:any=null;
 const work:Promise<void>[]=[];
 if(broker)work.push(broker.getLatestExecutionQuote(symbol).then(raw=>{alpaca=normalizeAlpacaQuote(symbol,raw.quote,raw.trade,asOf)}).catch(()=>{}));
 if(twelveKey)work.push(fetchTwelveRaw(symbol,twelveKey).then(raw=>{twelveRaw=raw;twelve=normalizeTwelveExecutionQuote(raw,asOf)}).catch(()=>{}));
 await Promise.all(work);
 return{integrity:assessQuoteIntegrity(alpaca,twelve),alpaca,twelve,twelveRaw};
}
