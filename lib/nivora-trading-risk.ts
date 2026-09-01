import type {TradeIntent} from "./nivora-trade-intent";
export const TRADING_RISK_VERSION="v61-paper-risk-1" as const;
export type PaperRiskPolicy={maxDailyLossPct:number;maxPositionPct:number;maxTradePct:number;maxOpenPositions:number;maxSpreadPct:number;maxGapPct:number;maxQuoteAgeSeconds:number;minCashReservePct:number;minTradeNotional:number};
export const DEFAULT_PAPER_RISK_POLICY:PaperRiskPolicy={maxDailyLossPct:3,maxPositionPct:10,maxTradePct:5,maxOpenPositions:20,maxSpreadPct:1,maxGapPct:10,maxQuoteAgeSeconds:45,minCashReservePct:10,minTradeNotional:100};
export type TradingRiskContext={equity:number;cash:number;dailyPnlPct:number;currentPositionValue:number;openPositions:number;duplicate:boolean;quote:{price:number;ageSeconds:number;freshness:"LIVE"|"STALE"|"LAST_TRADE";changePct?:number|null;spreadPct?:number|null}};
export type TradingRiskDecision={allowed:boolean;approvedNotional:number;reason:string;code:string;policyVersion:string};
export function evaluateTradingRisk(intent:Pick<TradeIntent,"side"|"intentType"|"targetNotional">,ctx:TradingRiskContext,p:PaperRiskPolicy=DEFAULT_PAPER_RISK_POLICY):TradingRiskDecision{
 const deny=(code:string,reason:string):TradingRiskDecision=>({allowed:false,approvedNotional:0,code,reason,policyVersion:TRADING_RISK_VERSION});
 if(ctx.duplicate)return deny("DUPLICATE","This evidence/action has already produced an order intent.");
 if(!Number.isFinite(ctx.equity)||ctx.equity<=0)return deny("NO_EQUITY","Paper account equity is unavailable.");
 if(ctx.quote.freshness!=="LIVE"||ctx.quote.ageSeconds>p.maxQuoteAgeSeconds)return deny("STALE_QUOTE","A fresh tradable quote is required before execution.");
 if((ctx.quote.spreadPct??0)>p.maxSpreadPct)return deny("WIDE_SPREAD","Bid/ask spread exceeds the execution policy.");
 if(intent.side==="BUY"&&Math.abs(ctx.quote.changePct??0)>p.maxGapPct)return deny("GAP_RISK","The current price gap exceeds the paper-entry policy.");
 if(intent.side==="BUY"&&ctx.dailyPnlPct<=-p.maxDailyLossPct)return deny("DAILY_LOSS_LIMIT","Daily loss limit has been reached; no new paper risk is allowed.");
 if(intent.side==="BUY"&&ctx.openPositions>=p.maxOpenPositions&&ctx.currentPositionValue<=0)return deny("POSITION_COUNT","Maximum open paper positions has been reached.");
 if(intent.side==="SELL"){const exitNotional=intent.intentType==="TRIM"?ctx.currentPositionValue*.5:ctx.currentPositionValue;return{allowed:exitNotional>0,approvedNotional:+Math.max(0,exitNotional).toFixed(2),code:exitNotional>0?"EXIT_ALLOWED":"NO_POSITION",reason:exitNotional>0?"Risk-reducing exit is allowed with a fresh quote.":"No paper position exists to reduce.",policyVersion:TRADING_RISK_VERSION};}
 const maxPosition=ctx.equity*(p.maxPositionPct/100),positionRoom=Math.max(0,maxPosition-ctx.currentPositionValue);
 const maxTrade=ctx.equity*(p.maxTradePct/100);
 const reserve=ctx.equity*(p.minCashReservePct/100),cashRoom=Math.max(0,ctx.cash-reserve);
 const approved=Math.max(0,Math.min(intent.targetNotional,maxTrade,positionRoom,cashRoom));
 if(approved<p.minTradeNotional)return deny("NO_CAPACITY","Portfolio, cash-reserve, or position limits leave insufficient capacity for a new paper order.");
 return{allowed:true,approvedNotional:+approved.toFixed(2),code:approved<intent.targetNotional?"RESIZED":"AUTHORIZED",reason:approved<intent.targetNotional?"Trade size was reduced to satisfy portfolio risk limits.":"Paper trade satisfies all configured risk gates.",policyVersion:TRADING_RISK_VERSION};
}
