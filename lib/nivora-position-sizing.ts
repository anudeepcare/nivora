
export type PositionSizingInput={equity:number;entry:number;invalidation:number;riskPerTradePct:number;maxPositionPct:number;liquidityCapNotional:number};
export type PositionSizingResult={allowed:boolean;shares:number;notional:number;riskBudget:number;riskPerShare:number;reason:string};
export function sizePosition(x:PositionSizingInput):PositionSizingResult{
 if(!Number.isFinite(x.equity)||x.equity<=0)return{allowed:false,shares:0,notional:0,riskBudget:0,riskPerShare:0,reason:"Equity must be positive."};
 if(!Number.isFinite(x.entry)||x.entry<=0||!Number.isFinite(x.invalidation)||x.invalidation<=0||x.invalidation>=x.entry)return{allowed:false,shares:0,notional:0,riskBudget:0,riskPerShare:0,reason:"Invalidation must be below a long entry price."};
 const riskBudget=x.equity*Math.max(0,x.riskPerTradePct)/100;
 const riskPerShare=x.entry-x.invalidation;
 const byRisk=Math.floor(riskBudget/riskPerShare);
 const maxNotional=Math.min(x.equity*Math.max(0,x.maxPositionPct)/100,Math.max(0,x.liquidityCapNotional));
 const byNotional=Math.floor(maxNotional/x.entry);
 const shares=Math.max(0,Math.min(byRisk,byNotional));
 if(shares<1)return{allowed:false,shares:0,notional:0,riskBudget:+riskBudget.toFixed(2),riskPerShare:+riskPerShare.toFixed(2),reason:"Risk, exposure or liquidity limits do not allow one share."};
 return{allowed:true,shares,notional:+(shares*x.entry).toFixed(2),riskBudget:+riskBudget.toFixed(2),riskPerShare:+riskPerShare.toFixed(2),reason:"Position is capped by the tightest of risk budget, portfolio exposure and liquidity."};
}
