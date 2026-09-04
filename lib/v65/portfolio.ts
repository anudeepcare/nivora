
import type {V65PortfolioAsset} from "./domain";

export type PricedPortfolioAsset =
 | ({assetType:"EQUITY";symbol:string;quantity:number;price:number;companyScore?:number|null;thesisScore?:number|null;action?:string;sector?:string|null} & Partial<V65PortfolioAsset>)
 | ({assetType:"CRYPTO";symbol:string;quantity:number;price:number;action?:string} & Partial<V65PortfolioAsset>)
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
