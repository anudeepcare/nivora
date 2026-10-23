/** Operating-company expectations model v1. Explicit assumptions; no market-data requests.
 * FCFF = after-tax operating profit minus reinvestment needed for assumed growth.
 * A constant operating margin and incremental return on capital are simplifications.
 */
export type EnterpriseInputs = {
  revenue:number; shares:number; cash:number; debt:number; growth:number;
  margin:number; tax:number; returnOnCapital:number; discount:number;
  terminalGrowth:number; years:number;
};
type OperatingYear={year:number;revenue:number;nopat:number;reinvestment:number;fcff:number;cashBuffer:number};
export type EnterpriseResult = {available:true;price:number;enterpriseValue:number;terminalShare:number;rows:OperatingYear[];terminalValue:number} | {available:false;reason:string};
export function enterpriseExpectations(p:EnterpriseInputs):EnterpriseResult {
  if(!Object.values(p).every(Number.isFinite)||p.revenue<=0||p.shares<=0||p.cash<0||p.debt<0||p.growth<=-100||p.growth>100||p.margin<=0||p.margin>80||p.tax<0||p.tax>60||p.returnOnCapital<=0||p.returnOnCapital>100||p.discount<=0||p.discount>50||p.terminalGrowth<0||p.terminalGrowth>=p.discount-1||p.terminalGrowth>=p.returnOnCapital||!Number.isInteger(p.years)||p.years<1||p.years>10)
    return {available:false,reason:'Use positive revenue, shares, operating margin and return on capital. Terminal growth must be below both the required return (by more than one percentage point) and return on capital.'};
  let revenue=p.revenue,pv=0,buffer=p.cash;const rows:OperatingYear[]=[];
  for(let year=1;year<=p.years;year++) {
    revenue*=1+p.growth/100;
    const nopat=revenue*p.margin/100*(1-p.tax/100);
    // No asset-disposal proceeds are credited during contraction.
    const reinvestment=nopat*Math.max(0,p.growth)/p.returnOnCapital;
    const fcff=nopat-reinvestment;buffer+=fcff;
    rows.push({year,revenue,nopat,reinvestment,fcff,cashBuffer:buffer});
    if(buffer < -1e-8)return {available:false,reason:`Funding gap in year ${year}: the assumed growth consumes more cash than the opening reserve and operations provide. Model explicit financing before estimating equity value.`};
    pv+=fcff/(1+p.discount/100)**year;
  }
  const last=rows.at(-1)!;
  const terminalCash=last.nopat*(1+p.terminalGrowth/100)*(1-p.terminalGrowth/p.returnOnCapital);
  const terminalValue=terminalCash/((p.discount-p.terminalGrowth)/100);
  const discountedTerminal=terminalValue/(1+p.discount/100)**p.years;
  const enterpriseValue=pv+discountedTerminal;
  const equity=enterpriseValue+p.cash-p.debt;
  if(!Number.isFinite(equity)||equity<=0)return {available:false,reason:'These assumptions leave no positive residual equity value after net debt.'};
  return {available:true,price:equity/p.shares,enterpriseValue,terminalValue,terminalShare:discountedTerminal/enterpriseValue*100,rows};
}
export function impliedOperatingMargin(p:EnterpriseInputs,price:number):number|null {
  if(!Number.isFinite(price)||price<=0)return null;
  let lo=.1,hi=80;const low=enterpriseExpectations({...p,margin:lo}),high=enterpriseExpectations({...p,margin:hi});
  if(p.growth>p.returnOnCapital||!high.available||(!low.available&&!low.reason.includes("residual equity"))||price<(low.available?low.price:0)||price>high.price)return null;
  for(let i=0;i<65;i++){const mid=(lo+hi)/2,r=enterpriseExpectations({...p,margin:mid});if(!r.available){if(r.reason.includes("residual equity")){lo=mid;continue;}return null;}if(r.price<price)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
