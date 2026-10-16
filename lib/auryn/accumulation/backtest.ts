/** Point-in-time, equal-budget DCA comparison. Research-only; no brokerage execution. */
export type HistoricalBar={date:string;close:number;fundamentalScore:number|null;valuationScore:number|null;technicalScore:number|null;evidenceFresh:boolean;thesisIntact:boolean;financingRisk:boolean};
export type SimulationPoint={date:string;close:number;fixedShares:number;adaptiveShares:number;fixedCash:number;adaptiveCash:number;fixedValue:number;adaptiveValue:number;multiplier:number;reason:string};
export function compareDcaPolicies(bars:HistoricalBar[],monthlyBudget:number,initialCash:number,feePerOrder=0){
 if(!Number.isFinite(monthlyBudget)||monthlyBudget<=0||!Number.isFinite(initialCash)||initialCash<0||!Number.isFinite(feePerOrder)||feePerOrder<0)throw Error('Invalid budget, cash or fees');
 if(bars.length>120||bars.length===0)throw Error('Require 1–120 historical observations');
 let fixedCash=initialCash,adaptiveCash=initialCash,fixedShares=0,adaptiveShares=0;
 const points:SimulationPoint[]=[];
 for(let index=0;index<bars.length;index++){
  const b=bars[index];if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(b.close)||b.close<=0||index>0&&b.date<=bars[index-1].date)throw Error('Invalid or unsorted historical bars');
  fixedCash+=monthlyBudget;adaptiveCash+=monthlyBudget;
  const fixedSpend=Math.min(monthlyBudget,Math.max(0,fixedCash-feePerOrder));
  if(fixedSpend>0){fixedShares+=fixedSpend/b.close;fixedCash-=fixedSpend+feePerOrder;}
  const score=(v:number|null)=>v===null?null:Math.max(0,Math.min(100,v));
  const f=score(b.fundamentalScore),v=score(b.valuationScore),t=score(b.technicalScore);
  let m=0;
  if(b.evidenceFresh&&b.thesisIntact&&!b.financingRisk&&f!==null&&v!==null&&t!==null){m=f<45||v<35?0:f<60||v<50?.5:1;if(f>=70&&v>=65&&t>=55)m=2;if(f>=80&&v>=75&&t>=65)m=3;if(f>=90&&v>=85&&t>=75)m=4;}
  const spend=Math.min(monthlyBudget*m,Math.max(0,adaptiveCash-feePerOrder));
  if(spend>0){adaptiveShares+=spend/b.close;adaptiveCash-=spend+feePerOrder;}
  points.push({date:b.date,close:b.close,fixedShares,adaptiveShares,fixedCash,adaptiveCash,fixedValue:fixedCash+fixedShares*b.close,adaptiveValue:adaptiveCash+adaptiveShares*b.close,multiplier:m,reason:m===0?'Pause / insufficient qualifying evidence':`${m}× policy`});
 }
 const last=points[points.length-1];return {points,fixedFinalValue:last.fixedValue,adaptiveFinalValue:last.adaptiveValue,difference:last.adaptiveValue-last.fixedValue,totalContributed:initialCash+monthlyBudget*bars.length,experimental:true as const};
}
