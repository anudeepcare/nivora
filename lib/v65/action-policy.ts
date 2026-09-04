import type{DecisionHorizonView}from"./domain";
export function deriveV65Actions(x:{thesisLabel:string;thesisScore:number;thesisState:string;todayAction:string;timingLabel:string;ownerAction?:string}):DecisionHorizonView{
 const thesis=String(x.thesisLabel||"").toUpperCase(),today=String(x.todayAction||"").toUpperCase(),timing=String(x.timingLabel||"").toUpperCase(),ownerRaw=String(x.ownerAction||"HOLD").toUpperCase();
 const longTerm= x.thesisState==="Broken"||x.thesisScore<35||thesis==="BEARISH"?"AVOID":thesis==="BULLISH"&&x.thesisScore>=80?"BUY":thesis==="BULLISH"?"STARTER_BUY":x.thesisScore>=55?"HOLD":"REDUCE";
 const newMoney= today==="BUY"||today==="STRONG BUY"?(timing==="ATTRACTIVE"?"BUY_NOW":"BUY_IN_ZONE"):today==="AVOID"||today==="SELL"||today==="NO ACTION"?"NO_NEW_CAPITAL":timing==="OVEREXTENDED"?"DO_NOT_CHASE":"WAIT_FOR_CONFIRMATION";
 const owner=ownerRaw.includes("SELL")||ownerRaw.includes("EXIT")?"EXIT":ownerRaw.includes("TRIM")||ownerRaw.includes("REDUCE")?"TRIM":ownerRaw.includes("ADD")?"ADD":"HOLD";
 return{longTerm,newMoney,owner};
}
