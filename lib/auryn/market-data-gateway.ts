import {AlpacaPaperBroker} from '../alpaca-paper';
import {loadTradingMarketData} from '../nivora-trading-market-data';
import {normalizeTwelveQuote,resolveTwelveRegularClose} from '../nivora-live-quote';
import {lastCompletedRegularSessionCloseTimestamp,lastCompletedRegularSessionDate} from '../nivora-market-session';
import {buildCanonicalMarketSnapshot,type CanonicalMarketSnapshot} from './market-truth';

export type MarketGatewayResult={snapshot:CanonicalMarketSnapshot;displayQuote:{change:number|null;changePct:number|null;bid:number|null;ask:number|null;spreadPct:number|null;provider:string|null;providerTimestamp:string|null;ageSeconds:number|null;freshness:string|null};providerRaw:{twelve:any|null}};

async function alpacaRegularClose(broker:AlpacaPaperBroker|null,symbol:string,asOf:Date){
 if(!broker||symbol.includes('/'))return null;
 try{
  const cutoff=lastCompletedRegularSessionDate(asOf);
  const bars=await broker.getRecentBars(symbol,8);
  const eligible=bars.filter(b=>!cutoff||String(b.datetime).slice(0,10)<=cutoff);
  const close=Number(eligible.at(-1)?.close);
  return Number.isFinite(close)&&close>0?close:null;
 }catch{return null;}
}

export async function loadCanonicalMarketSnapshot(input:{symbol:string;twelveKey?:string;alpacaKey?:string;alpacaSecret?:string;asOf?:Date;maxDisagreementPct?:number}):Promise<MarketGatewayResult>{
 const symbol=String(input.symbol||'').toUpperCase(),asOf=input.asOf??new Date();
 const broker=input.alpacaKey&&input.alpacaSecret&&!symbol.includes('/')?new AlpacaPaperBroker(input.alpacaKey,input.alpacaSecret):null;
 const market=await loadTradingMarketData(symbol,broker,input.twelveKey||'',asOf);
 const twelveDisplay=market.twelve&&market.twelveRaw?normalizeTwelveQuote(market.twelveRaw,asOf):null;
 const twelveClose=market.twelveRaw?resolveTwelveRegularClose(market.twelveRaw,asOf):(twelveDisplay?.regularClose??null);
 const regularClose=twelveClose??await alpacaRegularClose(broker,symbol,asOf);
 const regularCloseTimestamp=regularClose!=null?(lastCompletedRegularSessionCloseTimestamp(asOf)??lastCompletedRegularSessionDate(asOf)):null;
 const snapshot=buildCanonicalMarketSnapshot({symbol,asOf,primary:market.alpaca,secondary:market.twelve,regularClose,regularCloseTimestamp,maxDisagreementPct:input.maxDisagreementPct});
 const chosen=market.integrity.chosen;
 return{snapshot,displayQuote:{change:snapshot.priceState==='OFFICIAL_CLOSE'?null:(twelveDisplay?.change??null),changePct:snapshot.priceState==='OFFICIAL_CLOSE'?null:(chosen?.changePct??twelveDisplay?.changePct??null),bid:chosen?.bid??null,ask:chosen?.ask??null,spreadPct:chosen?.spreadPct??null,provider:chosen?.provider??(snapshot.priceState==='OFFICIAL_CLOSE'?'official-close':null),providerTimestamp:chosen?.providerTimestamp??snapshot.decisionPriceAsOf,ageSeconds:chosen?.ageSeconds??null,freshness:chosen?.freshness??(snapshot.priceState==='OFFICIAL_CLOSE'?'LAST_TRADE':null)},providerRaw:{twelve:market.twelveRaw}};
}

export async function loadCanonicalMarketSnapshots(inputs:Array<{symbol:string;twelveKey?:string;alpacaKey?:string;alpacaSecret?:string;asOf?:Date}> ,concurrency=6){
 const out=new Map<string,MarketGatewayResult>();
 for(let i=0;i<inputs.length;i+=Math.max(1,concurrency)){
  const batch=inputs.slice(i,i+Math.max(1,concurrency));
  const settled=await Promise.allSettled(batch.map(x=>loadCanonicalMarketSnapshot(x)));
  settled.forEach((r,idx)=>{if(r.status==='fulfilled')out.set(batch[idx].symbol.toUpperCase(),r.value)});
 }
 return out;
}
