import type {TodayAction,TodayDecision} from "./nivora-today";

export const TRADING_INTENT_VERSION="v63-trade-intent-1" as const;
export type TradeSide="BUY"|"SELL";
export type TradeIntentType="ENTER"|"ADD"|"TRIM"|"EXIT";
export type TradeIntent={
 id:string;symbol:string;side:TradeSide;intentType:TradeIntentType;referencePrice:number;
 targetNotional:number;createdAt:string;snapshotId:string;evidenceFingerprint:string;
 thesisScore:number;opportunityScore:number;companyScore:number;todayAction:TodayAction;
 todayReason:string;requiresApproval:false;version:string;
};
export type TradeIntentInput={symbol:string;snapshotId:string;evidenceFingerprint:string;price:number;observedAt:string;thesisScore:number;opportunityScore:number;companyScore:number;today:TodayDecision};

const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const entryNotional=(x:TradeIntentInput)=>{
 const conviction=Math.max(0,Math.min(100,(x.thesisScore+x.opportunityScore+x.companyScore)/3));
 return Math.round(1500+conviction*35);
};
export function deriveTradeIntent(x:TradeIntentInput):TradeIntent|null{
 if(!x.today)return null;
 const a=x.today.action;
 if(x.today.blocked&&(a==="BUY"||a==="ADD"))return null;
 if(a==="WAIT"||a==="HOLD"||a==="AVOID"||a==="NO ACTION")return null;
 const side:TradeSide=a==="SELL"||a==="TRIM"?"SELL":"BUY";
 const intentType:TradeIntentType=a==="BUY"?"ENTER":a==="ADD"?"ADD":a==="TRIM"?"TRIM":"EXIT";
 const rawNotional=side==="BUY"?entryNotional(x):0;
 const key=[TRADING_INTENT_VERSION,x.snapshotId,x.evidenceFingerprint,x.symbol,a,x.observedAt].join("|");
 return{id:`ti_${hash(key)}`,symbol:x.symbol.toUpperCase(),side,intentType,referencePrice:Number(x.price),targetNotional:rawNotional,createdAt:x.observedAt,snapshotId:x.snapshotId,evidenceFingerprint:x.evidenceFingerprint,thesisScore:x.thesisScore,opportunityScore:x.opportunityScore,companyScore:x.companyScore,todayAction:a,todayReason:x.today.reason,requiresApproval:false,version:TRADING_INTENT_VERSION};
}
