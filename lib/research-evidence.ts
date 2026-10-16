/** Presentation of reported facts only. This module does not issue investment actions. */
const numberOrNull=(value:unknown):number|null=>value==null||value===""||typeof value==="boolean"||!Number.isFinite(Number(value))?null:Number(value);
const currencyCode=(value:unknown):string|null=>typeof value==="string"&&/^[A-Z]{3}$/.test(value)?value:null;
const list=(value:any):any[]=>Array.isArray(value)?value:[];

export function formatReportedAmount(value:unknown,currency:unknown){
 const n=numberOrNull(value);
 if(n==null)return "—";
 const a=Math.abs(n),code=currencyCode(currency);
 const amount=a>=1e12?`${(a/1e12).toFixed(2)}T`:a>=1e9?`${(a/1e9).toFixed(2)}B`:a>=1e6?`${(a/1e6).toFixed(1)}M`:a>=1e3?`${(a/1e3).toFixed(1)}K`:a.toLocaleString("en-US",{maximumFractionDigits:2});
 return `${n<0?"-":""}${code?`${code} `:""}${amount}${code?"":" · currency unverified"}`;
}

export function researchSourceUrl(value:unknown):string|null{
 if(typeof value!=="string")return null;
 try{const url=new URL(value);return url.protocol==="https:"||url.protocol==="http:"?url.href:null;}catch{return null;}
}

function evidenceList(value:any):any[]{
 return Array.isArray(value)?value:value&&typeof value==="object"?Object.entries(value).map(([key,item]:[string,any])=>({...item,key:item?.key??key})):[];
}

export function buildBusinessEvidence(company:any,analystFundamentals:any,v4Analysis:any){
 const reported=company?.reportedMetrics??company?.rawMetrics??{};
 const usesReportedTotals=company?.reportedMetrics!=null;
 const currency=currencyCode(reported.currency)??currencyCode(company?.dataQuality?.reportedCurrency);
 const evidence=evidenceList(company?.evidence);
 const metricDefinitions=[
  {key:"revenue",label:"Revenue",ratio:false},
  {key:"netIncome",label:"Net income",ratio:false},
  {key:"fcf",label:"Free cash flow",ratio:false,inputs:["operatingCashFlow","capex"],basis:"Operating cash flow less capital expenditure"},
  {key:"opMargin",label:"Operating margin",ratio:true,inputs:["operatingIncome","revenue"],basis:"Operating income / revenue"},
  {key:"leverage",label:"Liabilities / assets",ratio:true,inputs:["liabilities","assets"],basis:"Total liabilities / total assets"},
 ];
 const metrics=metricDefinitions.map(definition=>{
  const key=definition.key==="netIncome"&&usesReportedTotals&&(evidence.some(e=>e?.key==="reportedNetIncome")||company?.dataQuality?.earningsBasis==="CONTINUING_OPERATIONS")?"reportedNetIncome":definition.key;
  const directRef=evidence.find(e=>e?.key===key);
  const inputs=(definition.inputs??[]).map(key=>{
   const sourceKey=key==="operatingCashFlow"&&usesReportedTotals&&(evidence.some(e=>e?.key==="reportedOperatingCashFlow")||company?.dataQuality?.cashFlowBasis==="CONTINUING_OPERATIONS")?"reportedOperatingCashFlow":key;
   return evidence.find(e=>e?.key===sourceKey);
  });
  const input=inputs[0];
  const inputsMatch=inputs.length>0&&inputs.every(ref=>ref&&ref.periodEnd&&ref.periodEnd===input.periodEnd&&(ref.periodStart??null)===(input.periodStart??null)&&ref.currency===input.currency&&ref.source===input.source);
  const ref=directRef??(inputsMatch?{...input,filedAt:inputs.map(ref=>ref.filedAt).filter(Boolean).sort().at(-1)}:null);
  const value=numberOrNull(reported[definition.key]);
  const unit=currencyCode(ref?.currency)??currencyCode(ref?.unit)??currency;
  const sourceUrls=[...new Set((directRef?[directRef]:inputsMatch?inputs:[]).map(source=>researchSourceUrl(source?.sourceUrl)).filter((url):url is string=>url!=null))];
  const accountingBasis=definition.key==="netIncome"?(usesReportedTotals?"Reported total":company?.dataQuality?.earningsBasis==="CONTINUING_OPERATIONS"?"Continuing operations":null):definition.key==="fcf"&&usesReportedTotals?"Reported consolidated":null;
  const continuingIncome=definition.key==="netIncome"&&usesReportedTotals?numberOrNull(reported.continuingNetIncome):null;
  const continuingDisplay=continuingIncome!=null&&continuingIncome!==value?formatReportedAmount(continuingIncome,unit):null;
  const valuationExcluded=definition.key==="fcf"&&usesReportedTotals&&company?.rawMetrics?.fcf===null&&(company?.dataQuality?.cashFlowBasis==="CONTINUING_OPERATIONS"||company?.dataQuality?.earningsBasis==="CONTINUING_OPERATIONS");
  return {...definition,value,display:value==null?"—":definition.ratio?`${value.toFixed(1)}%`:formatReportedAmount(value,unit),currency:unit,source:ref?.source??null,period:ref?.period??null,periodEnd:ref?.periodEnd??null,filedAt:ref?.filedAt??null,sourceUrls,accountingBasis,continuingDisplay,valuationExcluded};
 });
 const history=list(company?.fiveYearRecord?.history).slice(-5).map(row=>{
  const rowEvidence=evidenceList(row?.evidence);
  const rowCurrency=currencyCode(row?.currency)??currency;
  const display=(key:string)=>{
   const ref=rowEvidence.find(e=>e?.key===key);
   return formatReportedAmount(row?.[key],currencyCode(ref?.currency)??currencyCode(ref?.unit)??rowCurrency);
  };
  const basisLabel=(basis:unknown)=>basis==="CONTINUING_OPERATIONS"?"Continuing operations":basis==="REPORTED"?"Reported total":null;
  return {year:String(row?.year??row?.periodEnd??"Unknown period"),periodEnd:row?.periodEnd??null,filedAt:row?.filedAt??null,currency:rowCurrency,comparable:row?.comparable===true,revenue:display("revenue"),netIncome:display("netIncome"),operatingCashFlow:display("operatingCashFlow"),earningsBasis:basisLabel(row?.earningsBasis),cashFlowBasis:basisLabel(row?.cashFlowBasis),rawNetIncome:numberOrNull(row?.netIncome),rawOperatingCashFlow:numberOrNull(row?.operatingCashFlow),sourceUrl:researchSourceUrl(rowEvidence.find(e=>researchSourceUrl(e?.sourceUrl))?.sourceUrl)};
 });
 const comparable=company?.dataQuality?.comparableHistory===true&&history.length>0&&history.every(row=>row.comparable);
 const profitYears=history.filter(row=>row.comparable&&row.rawNetIncome!=null),cashYears=history.filter(row=>row.comparable&&row.rawOperatingCashFlow!=null);
 // A record score measures financial consistency; it cannot establish a competitive moat.
 const durabilityScore=history.length>=3&&comparable?numberOrNull(analystFundamentals?.companyDimensions?.durability):null;
 const refs=[...evidence,...list(v4Analysis?.evidenceRefs)];
 const sourceBackedReason=(reason:any)=>{
  const ids=list(reason?.evidenceIds).filter(id=>typeof id==="string"&&!id.startsWith("legacy:"));
  if(!reason?.text||!ids.length)return null;
  const sources=ids.map(id=>refs.find(ref=>ref?.id===id)).filter(Boolean);
  if(sources.length!==ids.length||sources.some(ref=>!["SEC","ISSUER","PROVIDER"].includes(ref.source)||ref.validationState==="HEURISTIC"||ref.validationState==="UNAVAILABLE"||ref.validationState==="COLLECTING"||!(ref.asOf||ref.filedAt||ref.periodEnd)))return null;
  return {text:String(reason.text),sources:sources.map(ref=>({source:String(ref.source),date:String(ref.filedAt??ref.asOf??ref.periodEnd),url:researchSourceUrl(ref.sourceUrl)}))};
 };
 const drivers=list(v4Analysis?.moat?.drivers).map(sourceBackedReason).filter((value):value is NonNullable<typeof value>=>value!=null);
 const threats=list(v4Analysis?.moat?.threats).map(sourceBackedReason).filter((value):value is NonNullable<typeof value>=>value!=null);
 const assessed=drivers.length>0||threats.length>0;
 const moatFactor=v4Analysis?.factors?.MOAT;
 const scoreSources=sourceBackedReason({text:"Moat factor",evidenceIds:moatFactor?.evidenceIds});
 const moatScore=assessed&&scoreSources&&moatFactor?.validationState==="MEASURED"?numberOrNull(v4Analysis?.moat?.score):null;
 return {metrics,history,currency,comparable,durabilityScore,profitYears:profitYears.length?`${profitYears.filter(row=>Number(row.rawNetIncome)>0).length} of ${profitYears.length} comparable years`:null,cashYears:cashYears.length?`${cashYears.filter(row=>Number(row.rawOperatingCashFlow)>0).length} of ${cashYears.length} comparable years`:null,warnings:list(company?.dataQuality?.warnings).filter(value=>typeof value==="string"),moat:{assessed,score:moatScore,drivers,threats}};
}

/** Explanations preserve canonical actions and never create a recommendation. */
export function explainResearchActions(decision:any){
 const newMoney:Record<string,string>={STRONG_BUY:"Strong canonical buy signal for new money; use the verified execution plan.",BUY:"New money is eligible under the canonical plan.",START_SMALL:"Only a starter position is supported by the current plan.",WAIT:"Wait for the stated decision trigger before adding new money.",AVOID:"Do not commit new money under the current evidence."};
 const owner:Record<string,string>={ADD:"The canonical plan supports adding to existing exposure.",HOLD:"Retain existing exposure; this does not authorize a new purchase.",WATCH:"Monitor existing exposure for the stated decision trigger.",REDUCE:"Reduce existing exposure under the canonical plan.",EXIT:"The canonical plan calls for closing existing exposure."};
 const longTerm:Record<string,string>={ATTRACTIVE:"The current multi-year case is favorable; price and entry timing still matter.",SELECTIVE:"The multi-year case is mixed; ownership depends on valuation and operating proof.",UNATTRACTIVE:"The multi-year case is currently unfavorable; this does not establish that the business thesis is broken."};
 return {newMoney:newMoney[decision?.newMoneyAction]??"Current instruction for committing new capital.",owner:owner[decision?.ownerAction]??"Current instruction for an existing position.",longTerm:longTerm[decision?.longTermAction]??"Current multi-year assessment of the investment case."};
}
