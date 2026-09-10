import {marketSessionAt,quoteFreshness,type MarketSession,type QuoteFreshness} from "./nivora-market-session";

export type NivoraLiveQuote={
  symbol:string;price:number;regularClose:number|null;change:number|null;changePct:number|null;
  session:MarketSession;isExtendedHours:boolean;providerTimestamp:string|null;ageSeconds:number|null;
  freshness:QuoteFreshness;provider:string;isRealTime:boolean;
  integrityState?:string;integrityReason?:string;integrityTradable?:boolean;disagreementPct?:number|null;
  sources?:Array<{provider:string;price:number;ageSeconds:number|null;freshness:QuoteFreshness}>;
};
const num=(v:any)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const isoFromEpoch=(v:any)=>{const n=num(v);if(n==null)return null;const d=new Date(n*1000);return Number.isFinite(d.getTime())?d.toISOString():null};

/**
 * Twelve Data has two quote shapes in the wild:
 * 1) split extended fields: close=current regular-session close, extended_price=pre/post price
 * 2) legacy extended row: close=extended price, previous_close=regular-session close, is_extended_hours=true
 * Never blindly use previous_close after the closing bell: in split-field responses it is the PRIOR trading day.
 */
export function resolveTwelveRegularClose(raw:any,asOf=new Date()){
  const session=marketSessionAt(asOf);
  const close=num(raw?.close)??num(raw?.price);
  const previous=num(raw?.previous_close);
  const legacyExtended=Boolean(raw?.is_extended_hours);
  const hasSeparateExtended=num(raw?.extended_price)!=null||num(raw?.extended_timestamp)!=null;

  if(session==='REGULAR')return previous??close;
  if(hasSeparateExtended)return close??previous;
  if(legacyExtended&&(session==='PRE_MARKET'||session==='AFTER_HOURS'||session==='CLOSED'||session==='OVERNIGHT'))return previous??close;
  return close??previous;
}

export function normalizeTwelveQuote(raw:any,asOf=new Date()):NivoraLiveQuote{
  const session=marketSessionAt(asOf);
  const regularClose=resolveTwelveRegularClose(raw,asOf);
  const close=num(raw?.close)??num(raw?.price)??0;
  const extendedPrice=num(raw?.extended_price);
  const extendedTimestamp=isoFromEpoch(raw?.extended_timestamp);
  const regularTimestamp=isoFromEpoch(raw?.timestamp);
  const splitExtended=extendedPrice!=null&&extendedPrice>0&&extendedTimestamp!=null;
  const legacyExtended=Boolean(raw?.is_extended_hours);
  const useExtended=(session==='PRE_MARKET'||session==='AFTER_HOURS'||session==='CLOSED'||session==='OVERNIGHT')&&(splitExtended||legacyExtended);
  const price=useExtended&&splitExtended?extendedPrice!:close;
  const providerTimestamp=useExtended&&splitExtended?extendedTimestamp:regularTimestamp;
  const providerDate=providerTimestamp?new Date(providerTimestamp):null;
  const ageSeconds=providerDate&&Number.isFinite(providerDate.getTime())?Math.max(0,Math.round((asOf.getTime()-providerDate.getTime())/1000)):null;
  const freshness=quoteFreshness(ageSeconds??Number.POSITIVE_INFINITY,session);
  const change=useExtended&&splitExtended?(num(raw?.extended_change)??(regularClose!=null?price-regularClose:null)):num(raw?.change);
  const changePct=useExtended&&splitExtended?(num(raw?.extended_percent_change)??(regularClose&&regularClose>0?((price/regularClose)-1)*100:null)):num(raw?.percent_change);
  return{symbol:String(raw?.symbol||"").toUpperCase(),price,regularClose,change,changePct,session,isExtendedHours:useExtended,providerTimestamp,ageSeconds,freshness,provider:"twelvedata",isRealTime:freshness==="LIVE"};
}
