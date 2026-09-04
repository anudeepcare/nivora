import {marketSessionAt,quoteFreshness,type MarketSession,type QuoteFreshness} from "./nivora-market-session";
import {normalizeTwelveQuote} from "./nivora-live-quote";
export type ExecutionQuote={symbol:string;price:number;bid:number|null;ask:number|null;spreadPct:number|null;changePct:number|null;providerTimestamp:string|null;ageSeconds:number|null;session:MarketSession;freshness:QuoteFreshness;provider:"alpaca"|"twelvedata";isRealTime:boolean};
const n=(v:any)=>{const x=Number(v);return Number.isFinite(x)?x:null};
export function normalizeAlpacaQuote(symbol:string,quoteRaw:any,tradeRaw:any,asOf=new Date()):ExecutionQuote{
 const q=quoteRaw?.quote||quoteRaw||{},t=tradeRaw?.trade||tradeRaw||{},bid=n(q.bp??q.bid_price),ask=n(q.ap??q.ask_price),trade=n(t.p??t.price);
 const qStamp=String(q.t??q.timestamp??"")||null,tStamp=String(t.t??t.timestamp??"")||null;
 const qDate=qStamp?new Date(qStamp):null,tDate=tStamp?new Date(tStamp):null;
 const qMs=qDate&&Number.isFinite(qDate.getTime())?qDate.getTime():0,tMs=tDate&&Number.isFinite(tDate.getTime())?tDate.getTime():0;
 const quoteMid=bid!=null&&ask!=null?(bid+ask)/2:ask??bid??null;
 const useQuote=quoteMid!=null&&qMs>=tMs;
 const price=useQuote?quoteMid!:(trade??quoteMid??0),d=useQuote?qDate:(tDate??qDate);
 const ageSeconds=d&&Number.isFinite(d.getTime())?Math.max(0,Math.round((asOf.getTime()-d.getTime())/1000)):null;
 const session=marketSessionAt(asOf),freshness=quoteFreshness(ageSeconds??Infinity,session),mid=bid!=null&&ask!=null?(bid+ask)/2:null,spreadPct=mid&&mid>0?+(((ask!-bid!)/mid)*100).toFixed(4):null;
 return{symbol:symbol.toUpperCase(),price,bid,ask,spreadPct,changePct:null,providerTimestamp:d&&Number.isFinite(d.getTime())?d.toISOString():null,ageSeconds,session,freshness,provider:"alpaca",isRealTime:freshness==="LIVE"};
}

export function normalizeTwelveExecutionQuote(raw:any,asOf=new Date()):ExecutionQuote{
 const q=normalizeTwelveQuote(raw,asOf);
 return{symbol:q.symbol,price:q.price,bid:null,ask:null,spreadPct:null,changePct:q.changePct,providerTimestamp:q.providerTimestamp,ageSeconds:q.ageSeconds,session:q.session,freshness:q.freshness,provider:"twelvedata",isRealTime:q.isRealTime};
}
