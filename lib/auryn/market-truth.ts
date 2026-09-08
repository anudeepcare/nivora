import type {ExecutionQuote} from "../nivora-execution-quote";
import {assessQuoteIntegrity} from "../nivora-provider-consensus";
import {marketCalendarAt,type MarketCalendarState,type MarketSession} from "../nivora-market-session";

export type CanonicalPriceState="LIVE_VERIFIED"|"LIVE_SINGLE_SOURCE"|"OFFICIAL_CLOSE"|"UNVERIFIED"|"UNAVAILABLE";
export type CanonicalPriceUse="LIVE_EXECUTION"|"RESEARCH_LIVE_SINGLE_SOURCE"|"RESEARCH_EXTENDED"|"RESEARCH_CLOSE"|"BLOCKED";
export type DecisionPriceRole="LIVE_MARKET"|"REGULAR_CLOSE"|"NONE";
export type CanonicalMarketSource={provider:string;price:number;providerTimestamp:string|null;ageSeconds:number|null;freshness:string};
export type CanonicalMarketSnapshot={
  snapshotId:string;symbol:string;asOf:string;session:MarketSession;calendarState:MarketCalendarState;
  priceState:CanonicalPriceState;
  decisionPrice:number|null;displayPrice:number|null;decisionPriceAsOf:string|null;decisionPriceRole:DecisionPriceRole;
  regularClose:number|null;regularClosePrice:number|null;regularCloseAsOf:string|null;
  liveMarketPrice:number|null;liveMarketPriceAsOf:string|null;
  executionPrice:number|null;executionPriceAsOf:string|null;
  extendedPrice:number|null;
  providerAgreementPct:number|null;contextProviderGapPct:number|null;sources:CanonicalMarketSource[];
  priceSensitiveAllowed:boolean;decisionAllowed:boolean;executionTradable:boolean;priceUse:CanonicalPriceUse;reason:string;
};

const finitePrice=(x:unknown)=>{const n=Number(x);return Number.isFinite(n)&&n>0?n:null};
const round4=(n:number)=>Math.round(n*10000)/10000;
const fingerprint=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};

export function buildCanonicalMarketSnapshot(input:{symbol:string;asOf?:Date;primary?:ExecutionQuote|null;secondary?:ExecutionQuote|null;regularClose?:number|null;regularCloseTimestamp?:string|null;maxDisagreementPct?:number}):CanonicalMarketSnapshot{
  const asOf=input.asOf??new Date(),symbol=String(input.symbol||"").toUpperCase();
  const calendar=marketCalendarAt(asOf),regularClose=finitePrice(input.regularClose),maxGap=input.maxDisagreementPct??1;
  const regularCloseAsOf=input.regularCloseTimestamp??null;
  const integrity=assessQuoteIntegrity(input.primary??null,input.secondary??null,maxGap);
  const sources=[input.primary,input.secondary].filter((x):x is ExecutionQuote=>Boolean(x)).map(x=>({provider:x.provider,price:x.price,providerTimestamp:x.providerTimestamp,ageSeconds:x.ageSeconds,freshness:x.freshness}));
  const rawProviderGapPct=integrity.disagreementPct==null?null:round4(integrity.disagreementPct);
  let providerAgreementPct:number|null=(calendar.session==="REGULAR"||calendar.session==="PRE_MARKET"||calendar.session==="AFTER_HOURS")?rawProviderGapPct:null;
  const contextProviderGapPct=rawProviderGapPct;

  let priceState:CanonicalPriceState="UNAVAILABLE",decisionPrice:number|null=null,displayPrice:number|null=null,extendedPrice:number|null=null,decisionPriceAsOf:string|null=null;
  let liveMarketPrice:number|null=null,liveMarketPriceAsOf:string|null=null,executionPrice:number|null=null,executionPriceAsOf:string|null=null;
  let decisionPriceRole:DecisionPriceRole="NONE",priceSensitiveAllowed=false,executionTradable=false;
  let priceUse:CanonicalPriceUse="BLOCKED";
  let reason="No verified market price is available.";

  const useRegularClose=(why:string)=>{
    if(regularClose==null)return false;
    priceState="OFFICIAL_CLOSE";decisionPrice=regularClose;displayPrice=regularClose;decisionPriceAsOf=regularCloseAsOf;decisionPriceRole="REGULAR_CLOSE";
    priceSensitiveAllowed=true;executionTradable=false;priceUse="RESEARCH_CLOSE";providerAgreementPct=null;reason=why;
    return true;
  };
  const useLive=(singleSource:boolean,extended:boolean)=>{
    const chosen=integrity.chosen!;
    priceState=singleSource?"LIVE_SINGLE_SOURCE":"LIVE_VERIFIED";decisionPrice=chosen.price;displayPrice=chosen.price;
    decisionPriceAsOf=chosen.providerTimestamp??asOf.toISOString();decisionPriceRole="LIVE_MARKET";liveMarketPrice=chosen.price;liveMarketPriceAsOf=decisionPriceAsOf;priceSensitiveAllowed=true;
    if(extended){
      extendedPrice=chosen.price;executionTradable=false;priceUse="RESEARCH_EXTENDED";
      reason=singleSource?"One fresh extended-hours provider is available; AURYN uses it for research context only and keeps execution blocked.":"Independent fresh extended-hours providers agree; AURYN uses the extended-hours price for research context only and keeps execution blocked.";
    }else if(singleSource){
      executionTradable=false;priceUse="RESEARCH_LIVE_SINGLE_SOURCE";
      reason="One fresh provider is available without a contradictory fresh provider; research is allowed, but execution requires independent live verification.";
    }else{
      executionTradable=true;executionPrice=chosen.price;executionPriceAsOf=decisionPriceAsOf;priceUse="LIVE_EXECUTION";
      reason="Independent fresh providers agree within the market-truth tolerance.";
    }
  };

  if(calendar.session==="REGULAR"){
    if(integrity.state==="LIVE_VERIFIED"&&integrity.chosen)useLive(false,false);
    else if(integrity.state==="LIVE_SINGLE_SOURCE"&&integrity.chosen){
      const closeGap=regularClose==null?null:Math.abs(integrity.chosen.price-regularClose)/regularClose*100;
      if(closeGap!=null&&closeGap>30){
        priceState="UNVERIFIED";reason=`The only fresh provider is ${closeGap.toFixed(2)}% away from the last regular close. AURYN requires an independent confirming source before accepting an extreme discontinuity.`;
      }else useLive(true,false);
    }else if(integrity.state==="DISAGREEMENT"){
      priceState="UNVERIFIED";reason=`Fresh providers disagree materially${providerAgreementPct==null?"":` (${providerAgreementPct.toFixed(2)}%)`}; AURYN blocked the live decision price.`;
    }else{
      priceState=sources.length?"UNVERIFIED":"UNAVAILABLE";reason=sources.length?"Available regular-session provider quotes are stale or timestamp-unverified; AURYN blocked the live decision price.":"No provider returned a usable regular-session market price.";
    }
  }else if(calendar.session==="PRE_MARKET"||calendar.session==="AFTER_HOURS"){
    const sessionLabel=calendar.session==="PRE_MARKET"?"Pre-market":"After-hours";
    if(integrity.state==="LIVE_VERIFIED"&&integrity.chosen)useLive(false,true);
    else if(integrity.state==="LIVE_SINGLE_SOURCE"&&integrity.chosen){
      const closeGap=regularClose==null?null:Math.abs(integrity.chosen.price-regularClose)/regularClose*100;
      if(closeGap==null||closeGap<=30)useLive(true,true);
      else if(!useRegularClose(`${sessionLabel} has an unconfirmed ${closeGap.toFixed(2)}% discontinuity; AURYN is anchored to the last verified regular close for research and keeps execution blocked.`)){
        priceState="UNVERIFIED";reason=`${sessionLabel} has an unconfirmed ${closeGap.toFixed(2)}% discontinuity and no verified regular close is available.`;
      }
    }else if(integrity.state==="DISAGREEMENT"){
      if(!useRegularClose(`${sessionLabel} providers disagree materially; AURYN is anchored to the last verified regular close for research and keeps execution blocked.`)){
        priceState="UNVERIFIED";reason=`${sessionLabel} providers disagree materially and a verified regular close is unavailable.`;
      }
    }else if(!useRegularClose(`${sessionLabel} quotes are stale, delayed, or timestamp-unverified; AURYN is anchored to the last verified regular close for continuous research and keeps execution blocked.`)){
      priceState=sources.length?"UNVERIFIED":"UNAVAILABLE";reason=`${sessionLabel} market data is not independently usable and a verified regular close is unavailable.`;
    }
  }else if(regularClose!=null){
    useRegularClose(calendar.calendarState==="HOLIDAY"?"U.S. equities are closed for an exchange holiday; AURYN is anchored to the last verified regular close.":"The market is closed; AURYN is anchored to the last verified regular close.");
    const recent=sources.filter(s=>s.price>0).sort((a,b)=>(a.ageSeconds??Infinity)-(b.ageSeconds??Infinity))[0];
    extendedPrice=recent&&Math.abs(recent.price-regularClose)/regularClose<.35?recent.price:null;
  }else{
    priceState=sources.length?"UNVERIFIED":"UNAVAILABLE";reason="The market is closed and a verified regular close is unavailable; price-sensitive analysis is blocked.";
  }

  const snapshotId=`${symbol}-${calendar.date}-${fingerprint(JSON.stringify({priceState,priceUse,decisionPrice,decisionPriceRole,regularClose,regularCloseAsOf,providerAgreementPct,sources:sources.map(s=>[s.provider,s.price,s.providerTimestamp])}))}`;
  return{snapshotId,symbol,asOf:asOf.toISOString(),session:calendar.session,calendarState:calendar.calendarState,priceState,decisionPrice,displayPrice,decisionPriceAsOf,decisionPriceRole,regularClose,regularClosePrice:regularClose,regularCloseAsOf,liveMarketPrice,liveMarketPriceAsOf,executionPrice,executionPriceAsOf,extendedPrice,providerAgreementPct,contextProviderGapPct,sources,priceSensitiveAllowed,decisionAllowed:priceSensitiveAllowed,executionTradable,priceUse,reason};
}
