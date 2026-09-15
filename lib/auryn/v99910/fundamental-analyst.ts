export type FundamentalRaw={revenue?:number|null;revGrowth?:number|null;netIncome?:number|null;fcf?:number|null;opMargin?:number|null;grossMargin?:number|null;leverage?:number|null};
export type FiveYearRecord={score?:number|null;revenueTrend?:string|null;profitTrend?:string|null;profitableYears?:number|null;positiveCashYears?:number|null};
export type FundamentalAnalystInput={rawMetrics?:FundamentalRaw|null;fiveYearRecord?:FiveYearRecord|null;businessScore?:number|null;forwardScore?:number|null;currentPrice?:number|null;marketCap?:number|null;businessModel?:string|null};
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
 if(["GENERAL_COMPOUNDER","CONSUMER","INDUSTRIAL","SEMICONDUCTOR_DESIGNER","DEFENSE"].includes(m))return"DCF_FCF_EARNINGS";
 return"GENERAL_RELATIVE";
};
function dcfPerShare(fcf:number,shares:number,growth:number,discountRate:number,terminalGrowth:number){
 let pv=0,cash=fcf;
 for(let y=1;y<=5;y++){const fade=Math.max(.18,1-(y-1)*.20);cash*=1+Math.max(-.12,Math.min(.22,growth*fade));pv+=cash/((1+discountRate)**y);}
 const terminal=cash*(1+terminalGrowth)/Math.max(.025,discountRate-terminalGrowth);
 return (pv+terminal/((1+discountRate)**5))/shares;
}
export function buildFundamentalAnalyst(input:FundamentalAnalystInput){
 const r=input.rawMetrics||{},fiveYearRecord=input.fiveYearRecord||{};
 const growth=nonlinearScore(r.revGrowth,10,8),profitability=nonlinearScore(r.opMargin,12,8),cashGeneration=finite(r.fcf)&&finite(r.revenue)&&Number(r.revenue)>0?nonlinearScore(Number(r.fcf)/Number(r.revenue)*100,10,7):null,balanceSheet=finite(r.leverage)?nonlinearScore(70-Number(r.leverage),15,12):null,durability=finite(fiveYearRecord.score)?nonlinearScore(Number(fiveYearRecord.score),62,13):null,forward=finite(input.forwardScore)?nonlinearScore(Number(input.forwardScore),60,14):null;
 const companyDimensions={growth,profitability,cashGeneration,balanceSheet,durability,forwardEvidence:forward};
 const trajectory=String(fiveYearRecord.revenueTrend||"").toUpperCase()==="STRONG"||String(fiveYearRecord.profitTrend||"").toUpperCase()==="IMPROVING"?"IMPROVING":String(fiveYearRecord.revenueTrend||"").toUpperCase()==="WEAKENING"?"DETERIORATING":"STABLE";
 const method=valuationMethodFor(input.businessModel),fcf=finite(r.fcf)?Number(r.fcf):null,revenue=finite(r.revenue)?Number(r.revenue):null,marketCap=finite(input.marketCap)?Number(input.marketCap):null,price=finite(input.currentPrice)?Number(input.currentPrice):null;
 const fcfYield=fcf!=null&&marketCap!=null&&marketCap>0?fcf/marketCap*100:null;
 const growthModels=["GROWTH_EV_SALES_FCF","AI_INFRA_SOTP_CAPACITY","BANK_PB_ROE_NIM","REIT_FFO_AFFO","BIOTECH_SCENARIO_PIPELINE","ENERGY_CYCLE_NAV","CYCLE_NORMALIZED","GENERAL_RELATIVE"];
 // V9.9.9.12 safety policy: do not publish a generic DCF as fair value for an archetype whose required method is not implemented with its required inputs.
 const decisionGrade=method==="DCF_FCF_EARNINGS"&&fcf!=null&&fcf>0&&revenue!=null&&revenue>0&&marketCap!=null&&marketCap>0&&price!=null&&price>0;
 const valuationState=decisionGrade?"MEASURED":(fcf!=null||revenue!=null?"PARTIAL":"UNAVAILABLE");
 let fundamentalScenario:any=null;
 if(decisionGrade&&fcf!=null&&revenue!=null&&marketCap!=null&&price!=null){
   const shares=marketCap/price,observedGrowth=finite(r.revGrowth)?Number(r.revGrowth)/100:.05,confidenceInputs=[r.revGrowth,r.fcf,r.opMargin,r.leverage,fiveYearRecord.score].filter(finite).length,confidence=Math.min(88,50+confidenceInputs*7);
   const mk=(label:string,growthAdj:number,discountRate:number,terminalGrowth:number)=>({label,value:+dcfPerShare(fcf,shares,observedGrowth+growthAdj,discountRate,terminalGrowth).toFixed(2)});
   const bear=mk("BEAR",-0.05,.12,.018),base=mk("BASE",0,.105,.023),bull=mk("BULL",.04,.095,.028);
   const ordered=[bear.value,base.value,bull.value].sort((a,b)=>a-b);bear.value=ordered[0];base.value=ordered[1];bull.value=ordered[2];
   fundamentalScenario={bear,base,bull,confidence,basis:"DCF / FCF",assumptions:{observedRevenueGrowthPct:finite(r.revGrowth)?Number(r.revGrowth):null,currentFcf:fcf,baseDiscountRate:10.5,baseTerminalGrowth:2.3,horizonYears:5},source:"SEC company facts + AURYN valuation policy",independentOfTechnicalLevels:true};
 }
 const fairValue=fundamentalScenario?.base?.value??null;
 const marginOfSafety=fairValue==null?null:(price!=null&&price>0?(fairValue/price-1)*100:null);
 const valuationScore=marginOfSafety==null?null:score(50+marginOfSafety*1.15);
 const relativeContext={vsHistory:null,vsPeers:null,growthAdjusted:null,fcfYield};
 return{companyDimensions,trajectory,businessModel:input.businessModel??null,method,valuationState,decisionGrade,missingMethodInputs:decisionGrade?[]:growthModels.includes(method)?["method-specific forward/relative valuation inputs required"]:[],fundamentalScenario,fairValue,marginOfSafety,valuationScore,relativeContext};
}
