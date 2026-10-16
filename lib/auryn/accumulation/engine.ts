/** AURYN-owned, transparent accumulation policy. No proprietary third-party signal reproduction. */
export type AccumulationInputs = {
  monthlyBudget: number; availableCash: number; price: number;
  fundamentalScore: number | null; valuationScore: number | null;
  technicalScore: number | null; evidenceFresh: boolean;
  thesisIntact: boolean; financingRisk: boolean;
  portfolioWeightPct: number; maxPortfolioWeightPct: number;
  months: number;
};
export type AccumulationResult = { multiplier: 0|0.5|1|2|3|4; contribution: number; shares: number; decision: string; reasons: string[]; experimental: true };
const bounded=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(100,n)):0;
export function evaluateAccumulation(i:AccumulationInputs):AccumulationResult {
  const reasons:string[]=[];
  if(!Number.isFinite(i.price)||i.price<=0||!Number.isFinite(i.monthlyBudget)||i.monthlyBudget<=0) throw new Error('Positive price and budget required');
  if(!i.evidenceFresh) reasons.push('Market or research evidence is stale');
  if(!i.thesisIntact) reasons.push('Business thesis is not intact');
  if(i.financingRisk) reasons.push('Elevated financing or dilution risk');
  if(i.fundamentalScore===null||i.valuationScore===null||i.technicalScore===null) reasons.push('Required evidence is missing');
  if(i.portfolioWeightPct>=i.maxPortfolioWeightPct) reasons.push('Portfolio concentration limit reached');
  if(reasons.length) return {multiplier:0,contribution:0,shares:0,decision:'Pause',reasons,experimental:true};
  const f=bounded(i.fundamentalScore!),v=bounded(i.valuationScore!),t=bounded(i.technicalScore!);
  // Technicals time an entry; fundamentals and valuation must independently qualify.
  let m:0|0.5|1|2|3|4= f<45||v<35 ? 0 : f<60||v<50 ? 0.5 : 1;
  if(f>=70&&v>=65&&t>=55)m=2;
  if(f>=80&&v>=75&&t>=65)m=3;
  if(f>=90&&v>=85&&t>=75)m=4;
  if(m===0)reasons.push('Business quality or valuation is below minimum thresholds');
  if(m===0.5)reasons.push('Reduced contribution while conviction or valuation is marginal');
  if(m>=1)reasons.push('Fundamentals and valuation independently support the allocation');
  if(m>=2)reasons.push('Technical setup adds timing confirmation');
  const budget=Math.max(0,i.monthlyBudget),cash=Math.max(0,i.availableCash);
  const contribution=Math.min(budget*m,cash);
  if(contribution<budget*m)reasons.push('Available cash limits the suggested contribution');
  if(contribution===0)reasons.push('No available cash');
  return {multiplier:contribution===0?0:m,contribution,shares:contribution/i.price,decision:contribution===0?'Pause':m===0.5?'Reduced DCA':`${m}× DCA`,reasons,experimental:true};
}
export function fixedDcaPlan(monthlyBudget:number,months:number){
 if(!Number.isFinite(monthlyBudget)||monthlyBudget<0||!Number.isInteger(months)||months<1||months>120)throw new Error('Invalid budget or duration');
 return Array.from({length:months},(_,index)=>({month:index+1,contribution:monthlyBudget}));
}
