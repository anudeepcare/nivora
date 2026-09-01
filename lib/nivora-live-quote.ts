import {marketSessionAt,quoteFreshness,type MarketSession,type QuoteFreshness} from "./nivora-market-session";

export type NivoraLiveQuote={
  symbol:string;price:number;regularClose:number|null;change:number|null;changePct:number|null;
  session:MarketSession;isExtendedHours:boolean;providerTimestamp:string|null;ageSeconds:number|null;
  freshness:QuoteFreshness;provider:string;isRealTime:boolean;
};
const num=(v:any)=>{const n=Number(v);return Number.isFinite(n)?n:null};
export function normalizeTwelveQuote(raw:any,asOf=new Date()):NivoraLiveQuote{
  const ts=num(raw?.timestamp);const providerDate=ts!=null?new Date(ts*1000):null;
  const providerTimestamp=providerDate&&Number.isFinite(providerDate.getTime())?providerDate.toISOString():null;
  const ageSeconds=providerDate?Math.max(0,Math.round((asOf.getTime()-providerDate.getTime())/1000)):null;
  const session=marketSessionAt(asOf);const freshness=quoteFreshness(ageSeconds??Number.POSITIVE_INFINITY,session);
  const price=num(raw?.close)??num(raw?.price)??0;
  return{symbol:String(raw?.symbol||"").toUpperCase(),price,regularClose:num(raw?.previous_close),change:num(raw?.change),changePct:num(raw?.percent_change),session,isExtendedHours:Boolean(raw?.is_extended_hours),providerTimestamp,ageSeconds,freshness,provider:"twelvedata",isRealTime:freshness==="LIVE"};
}
