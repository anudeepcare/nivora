import type {Position,Quote} from './types';
import {portfolioTotals} from './engine.ts';
export function positionContext(positions:Position[],quotes:Record<string,Quote>,symbol:string,gap:number|null){
 const total=portfolioTotals(positions,quotes),q=quotes[symbol],lots=positions.filter(p=>p.symbol===symbol&&p.assetType!=='cash'&&Number.isFinite(p.quantity)&&p.quantity>0&&Number.isFinite(p.cost)&&p.cost>=0),quantity=lots.reduce((s,p)=>s+p.quantity,0),priced=!!q&&!q.stale&&q.currency==='USD'&&q.price!=null&&Number.isFinite(q.price)&&q.price>0,value=priced?quantity*q.price!:null;
 return {quantity,value,weight:value!=null&&total.knownValue>0?value/total.knownValue*100:null,gapLoss:value!=null&&gap!=null&&Number.isFinite(gap)&&gap>=0?value*Math.min(gap,100)/100:null,missing:total.missing,pricedTotal:total.knownValue};
}
