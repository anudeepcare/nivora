export type FundamentalRaw={revenue?:number|null;revGrowth?:number|null;netIncome?:number|null;fcf?:number|null;opMargin?:number|null;grossMargin?:number|null;leverage?:number|null};
export type FiveYearRecord={score?:number|null;revenueTrend?:string|null;profitTrend?:string|null;profitableYears?:number|null;positiveCashYears?:number|null};
export type FundamentalAnalystInput={rawMetrics?:FundamentalRaw|null;fiveYearRecord?:FiveYearRecord|null;businessScore?:number|null;forwardScore?:number|null;currentPrice?:number|null;marketCap?:number|null};
const finite=(x:any):x is number=>Number.isFinite(Number(x));
const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const score=(x:number)=>Math.round(clamp(x));
const metricScore=(v:number|null|undefined,lo:number,hi:number)=>!finite(v)?null:score((Number(v)-lo)/(hi-lo)*100);
function dcfPerShare(fcf:number,shares:number,growth:number,discountRate:number,terminalGrowth:number){
 let pv=0,cash=fcf;
 for(let y=1;y<=5;y++){const fade=1-(y-1)*.12;cash*=1+Math.max(-.15,Math.min(.30,growth*fade));pv+=cash/((1+discountRate)**y);}
 const terminal=cash*(1+terminalGrowth)/Math.max(.02,discountRate-terminalGrowth);
 return (pv+terminal/((1+discountRate)**5))/shares;
}
export function buildFundamentalAnalyst(input:FundamentalAnalystInput){
 const r=input.rawMetrics||{},fiveYearRecord=input.fiveYearRecord||{};
 const growth=metricScore(r.revGrowth,-10,30),profitability=metricScore(r.opMargin,-5,30),cashGeneration=finite(r.fcf)&&finite(r.revenue)&&Number(r.revenue)>0?metricScore(Number(r.fcf)/Number(r.revenue)*100,-5,25):null,balanceSheet=finite(r.leverage)?score(100-(Number(r.leverage)-35)*1.35):null,durability=finite(fiveYearRecord.score)?score(Number(fiveYearRecord.score)):null,forward=finite(input.forwardScore)?score(Number(input.forwardScore)):null;
 const companyDimensions={growth,profitability,cashGeneration,balanceSheet,durability,forwardEvidence:forward};
 const trajectory=String(fiveYearRecord.revenueTrend||"").toUpperCase()==="STRONG"||String(fiveYearRecord.profitTrend||"").toUpperCase()==="IMPROVING"?"IMPROVING":String(fiveYearRecord.revenueTrend||"").toUpperCase()==="WEAKENING"?"DETERIORATING":"STABLE";
 let fundamentalScenario:any=null;
 const fcf=Number(r.fcf),revenue=Number(r.revenue),marketCap=Number(input.marketCap),price=Number(input.currentPrice);
 if(finite(fcf)&&fcf>0&&finite(revenue)&&revenue>0&&finite(marketCap)&&marketCap>0&&finite(price)&&price>0){
   const shares=marketCap/price;
   const observedGrowth=finite(r.revGrowth)?Number(r.revGrowth)/100:.06;
   const confidenceInputs=[r.revGrowth,r.fcf,r.opMargin,r.leverage,fiveYearRecord.score].filter(finite).length;
   const confidence=score(45+confidenceInputs*9);
   const mk=(label:string,growthAdj:number,discountRate:number,terminalGrowth:number)=>({label,value:+dcfPerShare(fcf,shares,observedGrowth+growthAdj,discountRate,terminalGrowth).toFixed(2),discountRate,terminalGrowth});
   const bear=mk("BEAR",-0.06,.115,.02),base=mk("BASE",0,.10,.025),bull=mk("BULL",.05,.09,.03);
   const ordered=[bear.value,base.value,bull.value].sort((a,b)=>a-b);bear.value=ordered[0];base.value=ordered[1];bull.value=ordered[2];
   fundamentalScenario={bear,base,bull,confidence,basis:"SEC free-cash-flow capitalization / five-year DCF policy",assumptions:{observedRevenueGrowthPct:finite(r.revGrowth)?Number(r.revGrowth):null,currentFcf:fcf,baseDiscountRate:10,baseTerminalGrowth:2.5,horizonYears:5},source:"SEC company facts + AURYN valuation policy",independentOfTechnicalLevels:true};
 }
 const fairValue=fundamentalScenario?.base?.value??null;
 const marginOfSafety=finite(fairValue)&&finite(input.currentPrice)&&Number(input.currentPrice)>0?(Number(fairValue)/Number(input.currentPrice)-1)*100:null;
 const valuationScore=marginOfSafety==null?null:score(50+marginOfSafety*1.4);
 return{companyDimensions,trajectory,fundamentalScenario,fairValue,marginOfSafety,valuationScore};
}
