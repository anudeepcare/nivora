const n=(x:any)=>Number.isFinite(Number(x))?Number(x):null;
const pct=(a:number,b:number)=>a?((b/a)-1)*100:null;
export const MAX_ZONE_WIDTH_PCT=12;
const zone=(center:any,widthPct=6)=>{const c=n(center);if(c==null)return null;const w=Math.min(MAX_ZONE_WIDTH_PCT,Math.max(2,widthPct))/200;return{low:c*(1-w),high:c*(1+w)}};
export function buildCioDecision(x:any){
 const business=n(x.businessScore),valuation=n(x.valuationScore),lt=n(x.longTerm?.score),timing=n(x.timingScore),price=n(x.current);
 const complete=[business,valuation,lt,timing].filter(v=>v!=null).length/4;
 const dataCompleteness=Math.round(complete*100);
 const confidence=Math.round(Math.max(20,Math.min(95,(business??50)*.25+(valuation??50)*.2+(lt??50)*.3+(timing??50)*.15+dataCompleteness*.1)));
 const longTermAction=(business??0)>=80&&(lt??0)>=60?"ACCUMULATE":(business??0)>=65&&(lt??0)>=45?"HOLD / SELECTIVE":(business??0)<45?"AVOID":"WATCH";
 const inEntry=price!=null&&n(x.entryLow)!=null&&n(x.entryHigh)!=null&&price>=Number(x.entryLow)&&price<=Number(x.entryHigh);
 const newMoneyAction=longTermAction==="AVOID"?"DO NOT BUY":inEntry&&(timing??0)>=55?"START SMALL":(timing??0)>=70?"BUY NOW":"WAIT";
 const ownerAction=longTermAction==="AVOID"?"REDUCE / EXIT":(business??0)>=75?"HOLD / ADD ON WEAKNESS":"HOLD";
 // Actionable zones are intentionally narrow; distant structural levels never get merged into one giant range.
 const starterZone=zone(price??x.entryHigh,5);
 const primaryCenter=n(x.longTerm?.fib618)??n(x.entryLow)??price;
 const primaryBuyZone=zone(primaryCenter,8);
 const deepCenter=n(x.longTerm?.fib786)??n(x.thesis);
 const deepValueZone=zone(deepCenter,10);
 const reassessBelow=n(x.longTerm?.invalidation)??n(x.thesis);
 const confirm=n(x.confirm),t1=n(x.t1),baseFair=n(x.fairValue);
 const todayRiskReward={downsidePct:price!=null&&n(x.thesis)!=null?pct(price,Number(x.thesis)):null,upsidePct:price!=null&&t1!=null?pct(price,t1):null};
 const longTermRiskReward={downsidePct:price!=null&&reassessBelow!=null?pct(price,reassessBelow):null,upsidePct:price!=null&&baseFair!=null?pct(price,baseFair):price!=null&&n(x.longTerm?.extension1272)!=null?pct(price,Number(x.longTerm.extension1272)):null};
 const positionSizing=newMoneyAction==="BUY NOW"?"NORMAL":newMoneyAction==="START SMALL"?"STARTER":longTermAction==="ACCUMULATE"?"STARTER / ADD IN PRIMARY ZONE":"NO NEW CAPITAL";
 const whatChangesIt=[
  confirm!=null?`Upgrade timing on confirmed strength above $${confirm.toFixed(2)}.`:null,
  reassessBelow!=null?`Downgrade the mapped long-term structure on a sustained weekly loss of $${reassessBelow.toFixed(2)}.`:null,
  valuation==null?`Reassess when decision-grade fundamental valuation becomes available.`:null,
  `Reassess on material earnings, margin, estimate or balance-sheet deterioration.`
 ].filter(Boolean);
 const nextCatalyst=x.nextCatalyst??"Next earnings / material estimate revision";
 return{longTermAction,newMoneyAction,ownerAction,confidence,dataCompleteness,starterZone,primaryBuyZone,deepValueZone,reassessBelow,todayRiskReward,longTermRiskReward,whatChangesIt,positionSizing,nextCatalyst};
}
