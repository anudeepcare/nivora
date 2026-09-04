
import type {V65PortfolioAsset} from "./domain";

export type PricedPortfolioAsset =
 | ({assetType:"EQUITY";symbol:string;quantity:number;price:number;companyScore?:number|null;thesisScore?:number|null;opportunityScore?:number|null;action?:string;sector?:string|null;archetype?:string|null;avgCost?:number|null} & Partial<V65PortfolioAsset>)
 | ({assetType:"CRYPTO";symbol:string;quantity:number;price:number;avgCost?:number|null;action?:string} & Partial<V65PortfolioAsset>)
 | ({assetType:"CASH";currency:string;amount:number} & Partial<V65PortfolioAsset>);

const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));

export function calculatePortfolioIntelligence(assets:PricedPortfolioAsset[]){
 const rows=assets.map((a:any)=>{
  const value=a.assetType==="CASH"?Number(a.amount||0):Number(a.quantity||0)*Number(a.price||0);
  return{...a,value:Number.isFinite(value)&&value>0?value:0};
 }).filter((x:any)=>x.value>0);
 const totalValue=rows.reduce((s:number,x:any)=>s+x.value,0);
 const cashValue=rows.filter((x:any)=>x.assetType==="CASH").reduce((s:number,x:any)=>s+x.value,0);
 const investedValue=totalValue-cashValue;
 const assetAllocation={EQUITY:0,CRYPTO:0,CASH:0} as Record<"EQUITY"|"CRYPTO"|"CASH",number>;
 rows.forEach((x:any)=>{const k=String(x.assetType) as "EQUITY"|"CRYPTO"|"CASH";assetAllocation[k]+=x.value});
 const invested=rows.filter((x:any)=>x.assetType!=="CASH");
 const weights=investedValue?invested.map((x:any)=>x.value/investedValue):[];
 const largestPositionPct=weights.length?Math.max(...weights)*100:0;
 const hhi=weights.reduce((s:number,w:number)=>s+w*w,0);
 const effectivePositions=hhi?1/hhi:0;
 const cashPct=totalValue?cashValue/totalValue*100:0;
 const cryptoPct=totalValue?assetAllocation.CRYPTO/totalValue*100:0;
 const scoreOf=(x:any)=>x.thesisScore!=null?Number(x.thesisScore):x.companyScore!=null?Number(x.companyScore):null;
 const scorable=rows.filter((x:any)=>x.assetType==="EQUITY"&&scoreOf(x)!=null&&Number.isFinite(scoreOf(x)));
 const scorableHoldings=scorable.length;
 const thesisQuality=scorable.length?scorable.reduce((s:number,x:any)=>s+Number(scoreOf(x)),0)/scorable.length:50;
 const actionBurden=invested.length?invested.filter((x:any)=>/AVOID|SELL|TRIM|EXIT|WAIT/i.test(String(x.action||""))).length/invested.length*100:0;

 const concentrationScore=clamp(100-largestPositionPct*2.2);
 const diversificationScore=clamp(effectivePositions>=8?100:effectivePositions/8*100);
 const liquidityScore=clamp(cashPct>=10&&cashPct<=35?90:cashPct<10?50+cashPct*4:Math.max(45,100-(cashPct-35)*1.5));
 const thesisScore=clamp(thesisQuality);
 const actionScore=clamp(100-actionBurden*.7);
 const score=Math.round(concentrationScore*.27+diversificationScore*.22+liquidityScore*.15+thesisScore*.24+actionScore*.12);
 const components=[
  {key:"concentration",label:"Concentration",score:Math.round(concentrationScore),reason:`Largest invested position ${largestPositionPct.toFixed(1)}%.`},
  {key:"diversification",label:"Diversification",score:Math.round(diversificationScore),reason:`Effective positions ${effectivePositions.toFixed(1)}.`},
  {key:"liquidity",label:"Liquidity / cash",score:Math.round(liquidityScore),reason:`Cash ${cashPct.toFixed(1)}% of portfolio.`},
  {key:"thesis",label:"Equity thesis quality",score:Math.round(thesisScore),reason:scorable.length?`${scorable.length} equity holdings scored.`:"No scorable equity holdings yet."},
  {key:"action",label:"Action burden",score:Math.round(actionScore),reason:`${actionBurden.toFixed(0)}% of invested holdings currently need attention.`}
 ];
 const health={score,label:score>=80?"STRONG":score>=65?"GOOD":score>=50?"MIXED":score>=35?"WEAK":"HIGH RISK",components};
 return{
  totalValue:+totalValue.toFixed(2),cashValue:+cashValue.toFixed(2),investedValue:+investedValue.toFixed(2),
  cashPct:+cashPct.toFixed(1),cryptoPct:+cryptoPct.toFixed(1),largestPositionPct:+largestPositionPct.toFixed(1),
  effectivePositions:+effectivePositions.toFixed(1),scorableHoldings,assetAllocation,health
 };
}


export type PortfolioSnapshot={asOf:string;totalValue:number;spy?:number|null;qqq?:number|null};
export type PortfolioPulseAction="ADD"|"HOLD"|"WATCH"|"TRIM_RISK"|"AVOID";

export function calculatePortfolioPulse(assets:PricedPortfolioAsset[],snapshots:PortfolioSnapshot[]=[]){
 const base=calculatePortfolioIntelligence(assets);
 const invested=(assets as any[]).filter(x=>x.assetType!=="CASH").map(x=>{
  const value=Number(x.quantity||0)*Number(x.price||0),cost=Number(x.quantity||0)*Number(x.avgCost||0);
  const pnl=Number.isFinite(cost)&&cost>0?value-cost:0;
  return{...x,value,cost,pnl,contributionPct:base.totalValue?100*pnl/base.totalValue:0};
 }).filter(x=>x.value>0);
 const drivers=[...invested].sort((a,b)=>Math.abs(b.pnl)-Math.abs(a.pnl)).map(x=>({symbol:x.symbol,pnl:+x.pnl.toFixed(2),contributionPct:+x.contributionPct.toFixed(2),returnPct:x.cost?+((x.value/x.cost-1)*100).toFixed(2):null}));
 const equityValue=invested.filter(x=>x.assetType==="EQUITY").reduce((a,x)=>a+x.value,0),cryptoValue=invested.filter(x=>x.assetType==="CRYPTO").reduce((a,x)=>a+x.value,0);
 const top=[...invested].sort((a,b)=>b.value-a.value);
 const top3Pct=base.totalValue?top.slice(0,3).reduce((a,x)=>a+x.value,0)/base.totalValue*100:0;
 const sectors:Record<string,number>={};for(const x of invested)if(x.assetType==="EQUITY")sectors[x.sector||"Unknown"]=(sectors[x.sector||"Unknown"]||0)+x.value;
 const sectorRows=Object.entries(sectors).map(([label,value])=>({label,value,pct:base.totalValue?value/base.totalValue*100:0})).sort((a,b)=>b.value-a.value);
 const actions=invested.map(x=>{
  const raw=String(x.action||"").toUpperCase();let portfolioAction:PortfolioPulseAction="HOLD",reason="Thesis is being tracked.";
  const weight=base.totalValue?x.value/base.totalValue*100:0;
  if(/AVOID|EXIT|SELL/.test(raw)){portfolioAction="AVOID";reason="Individual evidence is weak; review before adding capital."}
  else if(weight>=25){portfolioAction="TRIM_RISK";reason=`Position is ${weight.toFixed(1)}% of the portfolio; sizing risk is high even if the thesis remains intact.`}
  else if(/WAIT|WATCH|TRIM/.test(raw)){portfolioAction="WATCH";reason="Current NIVORA evidence calls for patience or review."}
  else if(/BUY|ADD|ACCUMULATE/.test(raw)&&Number(x.opportunityScore||0)>=60){portfolioAction="ADD";reason="Individual evidence is constructive and portfolio sizing is not excessive."}
  return{symbol:x.symbol,portfolioAction,companyAction:raw||"REVIEW",weightPct:+weight.toFixed(1),reason};
 }).sort((a,b)=>({ADD:0,WATCH:1,TRIM_RISK:2,AVOID:3,HOLD:4}[a.portfolioAction]-{ADD:0,WATCH:1,TRIM_RISK:2,AVOID:3,HOLD:4}[b.portfolioAction]));
 const ordered=[...snapshots].filter(x=>Number.isFinite(Number(x.totalValue))&&Number(x.totalValue)>0).sort((a,b)=>a.asOf.localeCompare(b.asOf));
 const first=ordered[0],last=ordered[ordered.length-1],hasActualPerformance=ordered.length>=2&&first.asOf!==last.asOf;
 const pct=(a:number|null|undefined,b:number|null|undefined)=>a&&b?+((b/a-1)*100).toFixed(2):null;
 const actualReturnPct=hasActualPerformance?pct(first.totalValue,last.totalValue):null,spyReturnPct=hasActualPerformance?pct(first.spy,last.spy):null,qqqReturnPct=hasActualPerformance?pct(first.qqq,last.qqq):null;
 const riskPenalty=Math.min(24,Math.max(0,base.largestPositionPct-18)*.8)+Math.min(12,base.cryptoPct*.18);
 const score=Math.round(clamp(base.health.score-riskPenalty));
 const label=score>=80?"STRONG":score>=65?"GOOD":score>=50?"MIXED":score>=35?"WEAK":"HIGH RISK";
 return{
  ...base,health:{...base.health,score,label},
  allocations:{equityPct:base.totalValue?+(equityValue/base.totalValue*100).toFixed(1):0,cryptoPct:base.cryptoPct,cashPct:base.cashPct},
  concentration:{largestPositionPct:base.largestPositionPct,top3Pct:+top3Pct.toFixed(1),largestSector:sectorRows[0]?.label||null,largestSectorPct:sectorRows[0]?+sectorRows[0].pct.toFixed(1):0},
  drivers,actions,
  history:{mode:hasActualPerformance?"ACTUAL":"TRACKING_STARTS_NOW",hasActualPerformance,points:ordered},
  performance:{actualReturnPct,spyReturnPct,qqqReturnPct,alphaVsSpyPct:actualReturnPct!=null&&spyReturnPct!=null?+(actualReturnPct-spyReturnPct).toFixed(2):null,alphaVsQqqPct:actualReturnPct!=null&&qqqReturnPct!=null?+(actualReturnPct-qqqReturnPct).toFixed(2):null}
 };
}
