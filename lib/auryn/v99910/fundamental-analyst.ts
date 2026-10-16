import type {FinancialAssessment} from '../../research-financial-assessment';
export type FundamentalRaw={revenue?:number|null;revGrowth?:number|null;netIncome?:number|null;fcf?:number|null;opMargin?:number|null;grossMargin?:number|null;leverage?:number|null};
export type FiveYearRecord={score?:number|null;revenueTrend?:string|null;profitTrend?:string|null;profitableYears?:number|null;positiveCashYears?:number|null};
export type FundamentalAnalystInput={rawMetrics?:FundamentalRaw|null;fiveYearRecord?:FiveYearRecord|null;businessScore?:number|null;forwardScore?:number|null;currentPrice?:number|null;marketCap?:number|null;businessModel?:string|null;financialAssessment?:FinancialAssessment|null};
const finite=(x:any):x is number=>x!==null&&x!==undefined&&x!==""&&Number.isFinite(Number(x));
const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const score=(x:number)=>Math.round(clamp(x));
// Smooth logistic scoring preserves differentiation at the extremes and avoids routine 0/100 saturation.
const nonlinearScore=(v:number|null|undefined,mid:number,scale:number)=>!finite(v)?null:Math.round(100/(1+Math.exp(-(Number(v)-mid)/Math.max(.01,scale))));
const valuationMethodFor=(businessModel:string|null|undefined)=>{
 const m=String(businessModel||"").toUpperCase();
 if(["SAAS_SOFTWARE","MARKETPLACE_ADTECH","FINTECH_PAYMENTS","DIGITAL_HEALTH_PLATFORM"].includes(m))return"GROWTH_EV_SALES_FCF";
 if(m==="BANK"||m==="INSURER")return"BANK_PB_ROE_NIM";
 if(m==="REIT")return"REIT_FFO_AFFO";
 if(m==="BIOTECH_PHARMA"||m==="MEDTECH")return"BIOTECH_SCENARIO_PIPELINE";
 if(m==="ENERGY"||m==="MINER_COMMODITY")return"ENERGY_CYCLE_NAV";
 if(m==="SEMICONDUCTOR_MEMORY_CYCLICAL")return"CYCLE_NORMALIZED";
 if(["AI_DATA_CENTER_INFRA","POWER_UTILITY_INFRA","NETWORKING_COMPUTE_INFRA"].includes(m))return"AI_INFRA_SOTP_CAPACITY";
 if(m==="SPACE_SATELLITE")return"FRONTIER_SCENARIO_RUNWAY";
 if(["GENERAL_COMPOUNDER","CONSUMER","INDUSTRIAL","SEMICONDUCTOR_DESIGNER","DEFENSE"].includes(m))return"DCF_FCF_EARNINGS";
 return"GENERAL_RELATIVE";
};
export function buildFundamentalAnalyst(input:FundamentalAnalystInput){
 const r=input.rawMetrics||{},fiveYearRecord=input.fiveYearRecord||{};
 const growth=nonlinearScore(r.revGrowth,10,8),profitability=nonlinearScore(r.opMargin,12,8),cashGeneration=finite(r.fcf)&&finite(r.revenue)&&Number(r.revenue)>0?nonlinearScore(Number(r.fcf)/Number(r.revenue)*100,10,7):null,balanceSheet=finite(r.leverage)?nonlinearScore(70-Number(r.leverage),15,12):null,durability=finite(fiveYearRecord.score)?nonlinearScore(Number(fiveYearRecord.score),62,13):null,forward=finite(input.forwardScore)?nonlinearScore(Number(input.forwardScore),60,14):null;
 const companyDimensions={growth,profitability,cashGeneration,balanceSheet,durability,forwardEvidence:forward};
 const hasTrajectoryEvidence=[fiveYearRecord.revenueTrend,fiveYearRecord.profitTrend].some(x=>["STRONG","IMPROVING","WEAKENING","MIXED","STABLE"].includes(String(x||"").toUpperCase()));
 const trajectory=!hasTrajectoryEvidence?"UNKNOWN":String(fiveYearRecord.revenueTrend||"").toUpperCase()==="STRONG"||String(fiveYearRecord.profitTrend||"").toUpperCase()==="IMPROVING"?"IMPROVING":String(fiveYearRecord.revenueTrend||"").toUpperCase()==="WEAKENING"?"DETERIORATING":"STABLE";
 const shared=input.financialAssessment?.version==='financial-assessment-v1'?input.financialAssessment:null;
 const valuation=shared?.valuation;
 const method=valuation?.method??valuationMethodFor(input.businessModel),fcf=finite(r.fcf)?Number(r.fcf):null,revenue=finite(r.revenue)?Number(r.revenue):null,marketCap=finite(input.marketCap)?Number(input.marketCap):null;
 const fcfYield=fcf!=null&&marketCap!=null&&marketCap>0?fcf/marketCap*100:null;
 const growthModels=["GROWTH_EV_SALES_FCF","AI_INFRA_SOTP_CAPACITY","FRONTIER_SCENARIO_RUNWAY","BANK_PB_ROE_NIM","REIT_FFO_AFFO","BIOTECH_SCENARIO_PIPELINE","ENERGY_CYCLE_NAV","CYCLE_NORMALIZED","GENERAL_RELATIVE"];
 // Only the shared evidence assessment can supply a canonical value. Scalar metrics cannot authorize it.
 const independentCrossChecks=valuation?.independentCrossChecks??0;
 const decisionGrade=Boolean(valuation?.decisionGrade&&valuation.scenarios);
 const valuationState=decisionGrade?"MEASURED":(valuation?.state??(fcf!=null||revenue!=null?"PARTIAL":"UNAVAILABLE"));
 let fundamentalScenario:any=null;
 if(decisionGrade&&valuation?.scenarios){
   const {bear,base,bull}=valuation.scenarios;
   fundamentalScenario={bear:{...bear,label:'BEAR'},base:{...base,label:'BASE'},bull:{...bull,label:'BULL'},confidence:null,basis:'Sourced equity cash flow / normalized earnings',assumptions:{observedRevenueGrowthPct:null,currentFcf:valuation.ownerCashFlow,baseDiscountRate:base.assumptions.discountRatePct,baseTerminalGrowth:base.assumptions.terminalGrowthPct,horizonYears:5},source:'SEC facts + dated equity-claim review + explicit AURYN policy',independentOfTechnicalLevels:true,evidenceIds:valuation.evidenceIds,policyVersion:valuation.policyVersion};
 }
 const fairValue=fundamentalScenario?.base?.value??null;
 const marginOfSafety=decisionGrade?valuation?.marginOfSafetyPct??null:null;
 const valuationScore=decisionGrade?valuation?.valuationScore??null:null;
 const relativeContext={vsHistory:null,vsPeers:null,growthAdjusted:null,fcfYield};
 const implementationState=decisionGrade?"IMPLEMENTED_WITH_EVIDENCE":valuation?.implementationState??(growthModels.includes(method)?"MODEL_NOT_IMPLEMENTED":"VALIDATION_REQUIRED");
 const missingMethodInputs:string[]=[...(valuation?.missingMethodInputs??[])];
 if(!valuation&&!decisionGrade){
   if(growthModels.includes(method))missingMethodInputs.push("The required sector valuation model is not implemented with verified inputs.");
   if(independentCrossChecks<1)missingMethodInputs.push("An independent, source-backed valuation cross-check is required.");
   if(method==="DCF_FCF_EARNINGS"&&(fcf==null||fcf<=0))missingMethodInputs.push("Positive, comparable free cash flow is required for the current DCF method.");
   if(revenue==null||revenue<=0)missingMethodInputs.push("Comparable reported revenue is unavailable.");
   missingMethodInputs.push("Dated current shares, financing claims and source lineage are required; scalar market capitalization and price cannot supply them.");
 }
 return{companyDimensions,trajectory,independentCrossChecks,businessModel:input.businessModel??null,method,valuationState,decisionGrade,implementationState,missingMethodInputs,fundamentalScenario,fairValue,marginOfSafety,valuationScore,relativeContext,financialAssessment:shared};
}
