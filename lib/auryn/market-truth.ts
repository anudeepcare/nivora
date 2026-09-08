import type {ExecutionQuote} from "../nivora-execution-quote";
import {assessQuoteIntegrity} from "../nivora-provider-consensus";
import {marketCalendarAt,type MarketCalendarState,type MarketSession} from "../nivora-market-session";

export type CanonicalPriceState="LIVE_VERIFIED"|"LIVE_SINGLE_SOURCE"|"OFFICIAL_CLOSE"|"UNVERIFIED"|"UNAVAILABLE";
export type CanonicalPriceUse="LIVE_EXECUTION"|"RESEARCH_LIVE_SINGLE_SOURCE"|"RESEARCH_CLOSE"|"BLOCKED";
export type CanonicalMarketSource={provider:string;price:number;providerTimestamp:string|null;ageSeconds:number|null;freshness:string};
export type CanonicalMarketSnapshot={
  snapshotId:string;symbol:string;asOf:string;session:MarketSession;calendarState:MarketCalendarState;
  priceState:CanonicalPriceState;decisionPrice:number|null;displayPrice:number|null;regularClose:number|null;extendedPrice:number|null;decisionPriceAsOf:string|null;
  providerAgreementPct:number|null;contextProviderGapPct:number|null;sources:CanonicalMarketSource[];priceSensitiveAllowed:boolean;decisionAllowed:boolean;executionTradable:boolean;priceUse:CanonicalPriceUse;reason:string;
};

const finitePrice=(x:unknown)=>{const n=Number(x);return Number.isFinite(n)&&n>0?n:null};
const round4=(n:number)=>Math.round(n*10000)/10000;
const fingerprint=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};

export function buildCanonicalMarketSnapshot(input:{symbol:string;asOf?:Date;primary?:ExecutionQuote|null;secondary?:ExecutionQuote|null;regularClose?:number|null;regularCloseTimestamp?:string|null;maxDisagreementPct?:number}):CanonicalMarketSnapshot{
  const asOf=input.asOf??new Date(),symbol=String(input.symbol||"").toUpperCase();
  const calendar=marketCalendarAt(asOf),regularClose=finitePrice(input.regularClose),maxGap=input.maxDisagreementPct??1;
  const integrity=assessQuoteIntegrity(input.primary??null,input.secondary??null,maxGap);
  const sources=[input.primary,input.secondary].filter((x):x is ExecutionQuote=>Boolean(x)).map(x=>({provider:x.provider,price:x.price,providerTimestamp:x.providerTimestamp,ageSeconds:x.ageSeconds,freshness:x.freshness}));
  const rawProviderGapPct=integrity.disagreementPct==null?null:round4(integrity.disagreementPct);
  // Provider disagreement is decision-relevant only when providers are being compared for the same live session.
  // Closed-market quotes can refer to different stale/extended contexts, so keep that gap diagnostic-only.
  const providerAgreementPct=(calendar.session==="REGULAR"||calendar.session==="PRE_MARKET"||calendar.session==="AFTER_HOURS")?rawProviderGapPct:null;
  const contextProviderGapPct=rawProviderGapPct;
  let priceState:CanonicalPriceState="UNAVAILABLE",decisionPrice:number|null=null,displayPrice:number|null=null,extendedPrice:number|null=null,decisionPriceAsOf:string|null=null,priceSensitiveAllowed=false,executionTradable=false;
  let priceUse:CanonicalPriceUse="BLOCKED";
  let reason="No verified market price is available.";

  if(calendar.session==="REGULAR"||calendar.session==="PRE_MARKET"||calendar.session==="AFTER_HOURS"){
    if(integrity.state==="LIVE_VERIFIED"&&integrity.chosen){
      priceState="LIVE_VERIFIED";decisionPrice=integrity.chosen.price;displayPrice=decisionPrice;decisionPriceAsOf=integrity.chosen.providerTimestamp??asOf.toISOString();priceSensitiveAllowed=true;executionTradable=true;priceUse="LIVE_EXECUTION";reason="Independent fresh providers agree within the market-truth tolerance.";
    }else if(integrity.state==="LIVE_SINGLE_SOURCE"&&integrity.chosen){
      const closeGap=regularClose==null?null:Math.abs(integrity.chosen.price-regularClose)/regularClose*100;
      if(closeGap!=null&&closeGap>30){
        priceState="UNVERIFIED";reason=`The only fresh provider is ${closeGap.toFixed(2)}% away from the last regular close. AURYN requires an independent confirming source before accepting an extreme discontinuity.`;
      }else{
        priceState="LIVE_SINGLE_SOURCE";decisionPrice=integrity.chosen.price;displayPrice=decisionPrice;decisionPriceAsOf=integrity.chosen.providerTimestamp??asOf.toISOString();priceSensitiveAllowed=true;executionTradable=false;priceUse="RESEARCH_LIVE_SINGLE_SOURCE";reason="One fresh provider is available without a contradictory fresh provider; research is allowed, but execution requires independent live verification.";
      }
    }else if(integrity.state==="DISAGREEMENT"){
      priceState="UNVERIFIED";reason=`Fresh providers disagree materially${providerAgreementPct==null?"":` (${providerAgreementPct.toFixed(2)}%)`}; AURYN blocked the price.`;
    }else{
      priceState=sources.length?"UNVERIFIED":"UNAVAILABLE";reason=sources.length?"Available provider quotes are stale or timestamp-unverified; AURYN blocked the price.":"No provider returned a usable market price.";
    }
  }else if(regularClose!=null){
    priceState="OFFICIAL_CLOSE";decisionPrice=regularClose;displayPrice=regularClose;decisionPriceAsOf=input.regularCloseTimestamp??null;priceSensitiveAllowed=true;executionTradable=false;priceUse="RESEARCH_CLOSE";
    const recent=sources.filter(s=>s.price>0).sort((a,b)=>(a.ageSeconds??Infinity)-(b.ageSeconds??Infinity))[0];
    extendedPrice=recent&&Math.abs(recent.price-regularClose)/regularClose<.35?recent.price:null;
    reason=calendar.calendarState==="HOLIDAY"?"U.S. equities are closed for an exchange holiday; AURYN is anchored to the last regular close.":"The market is closed; AURYN is anchored to the last regular close.";
  }else{
    priceState=sources.length?"UNVERIFIED":"UNAVAILABLE";reason="The market is closed and a verified regular close is unavailable; price-sensitive analysis is blocked.";
  }

  const snapshotId=`${symbol}-${calendar.date}-${fingerprint(JSON.stringify({priceState,priceUse,decisionPrice,regularClose,providerAgreementPct,sources:sources.map(s=>[s.provider,s.price,s.providerTimestamp])}))}`;
  return{snapshotId,symbol,asOf:asOf.toISOString(),session:calendar.session,calendarState:calendar.calendarState,priceState,decisionPrice,displayPrice,regularClose,extendedPrice,decisionPriceAsOf,providerAgreementPct,contextProviderGapPct,sources,priceSensitiveAllowed,decisionAllowed:priceSensitiveAllowed,executionTradable,priceUse,reason};
}
