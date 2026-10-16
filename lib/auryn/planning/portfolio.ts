export type ExposureHolding = {symbol: string; value: number | null; sector?: string | null; themes?: string[]; risks?: string[]};
const nonnegative = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function previewPurchase(input: {cash: number; totalValue: number | null; positionValue: number | null; amount: number; price: number | null; feeFixed?: number; feeBps?: number; slippageBps?: number}) {
  const {cash,totalValue,positionValue,amount,price,feeFixed=0,feeBps=0,slippageBps=0}=input;
  const valid=[cash,totalValue,positionValue,amount,feeFixed,feeBps,slippageBps].every(nonnegative) && nonnegative(price) && price>0 && amount<=cash && totalValue!>=cash+positionValue! && (amount===0 || amount>feeFixed);
  if(!valid)return {valid:false as const,reason:'Complete priced USD values and affordable nonnegative costs before previewing.',cashAfter:null,positionAfter:null,totalAfter:null,units:null,costs:null,marketValueAdded:null,positionPctAfter:null};
  const notional=amount===0?0:(amount-feeFixed)/(1+feeBps/10000);
  const units=notional/(price!*(1+slippageBps/10000));
  const marketValueAdded=units*price!,costs=amount-marketValueAdded;
  const totalAfter=totalValue!-costs,positionAfter=positionValue!+marketValueAdded;
  return {valid:true as const,reason:'Hypothetical purchase only; no order is placed.',cashAfter:cash-amount,positionAfter,totalAfter,units,costs,marketValueAdded,positionPctAfter:totalAfter>0?positionAfter/totalAfter*100:0};
}
export function concentration(holdings: ExposureHolding[], totalValue: number | null) {
  const known=holdings.filter((h): h is ExposureHolding & {value:number}=>nonnegative(h.value));
  const denominator=nonnegative(totalValue)&&totalValue>0?totalValue:null;
  const groups=(field:'symbol'|'sector'|'themes'|'risks')=>{
    const sums=new Map<string,number>();
    for(const h of known){const labels=field==='symbol'?[h.symbol]:field==='sector'?[h.sector||'Unclassified']:h[field]||[];for(const label of new Set(labels))sums.set(label,(sums.get(label)||0)+h.value);}
    return [...sums.entries()].map(([label,value])=>({label,value,pct:denominator===null?null:value/denominator*100})).sort((a,b)=>b.value-a.value);
  };
  const invested=known.reduce((sum,h)=>sum+h.value,0);
  return {assets:groups('symbol'),sectors:groups('sector'),themes:groups('themes'),risks:groups('risks'),sectorCoveragePct:invested>0?known.reduce((sum,h)=>sum+(h.sector?h.value:0),0)/invested*100:0,missingValues:holdings.length-known.length,correlation:null,
    limitations:['Theme and shared-risk groups may overlap; their percentages must not be added.','Unclassified holdings remain visible. Return correlation and underlying fund overlap are unavailable without aligned holdings and return histories.']};
}
export function stressPortfolio(holdings: ExposureHolding[], scenario:{name:string;shocks:Record<string,number>;cash:number}) {
  const missing=holdings.filter(h=>!nonnegative(h.value)||!Number.isFinite(scenario.shocks[h.symbol])||scenario.shocks[h.symbol]<-100).map(h=>h.symbol);
  if(!nonnegative(scenario.cash))missing.push('USD cash');
  const before=holdings.every(h=>nonnegative(h.value))&&nonnegative(scenario.cash)?holdings.reduce((s,h)=>s+h.value!,scenario.cash):null;
  const after=missing.length?null:holdings.reduce((sum,h)=>sum+h.value!*(1+scenario.shocks[h.symbol]/100),scenario.cash);
  return {name:scenario.name,before,after,loss:before===null||after===null?null:after-before,missing,assumptions:scenario.shocks,probability:null,kind:'USER_ASSUMPTION' as const};
}
export function performanceAttribution(input:{openingValue:number;closingValue:number;deposits:number;withdrawals:number}) {
  if(!Object.values(input).every(nonnegative))return {balanceChange:null,netContributions:null,investmentGain:null,returnPct:null,reason:'Complete nonnegative opening, closing and external cash-flow amounts.'};
  const balanceChange=input.closingValue-input.openingValue,netContributions=input.deposits-input.withdrawals;
  return {balanceChange,netContributions,investmentGain:balanceChange-netContributions,returnPct:null,reason:'Gain is the balance change less net external contributions. A return rate requires dated cash flows and valuations.'};
}
