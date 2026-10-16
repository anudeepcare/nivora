/** Exploratory cash-flow sensitivity only. Never feeds the canonical valuation gate. */
export type ValuationFact = {
  key?:string;value?:number|null;currency?:string|null;unit?:string;periodStart?:string|null;periodEnd?:string;
  filedAt?:string;accession?:string|null;scope?:string;source?:string;sourceUrl?:string|null;basis?:string;taxonomy?:string;
};
export type ValuationWorkbenchInput = {
  symbol:string;businessModel?:string|null;assetType?:string|null;currentPrice?:number|null;priceAsOf?:string|null;priceCurrency?:string|null;asOf?:string;
  company?:{evidence?:ValuationFact[];rawMetrics?:{fcf?:number|null};dataQuality?:{warnings?:string[]}}|null;
  profile?:{currency?:string|null;marketCapitalization?:number|null;shareOutstanding?:number|null}|null;
  reviewedShares?:{value:number|null;asOf:string}|null;
};
export type CashFlowAssumptions = {growthPct:number;discountRatePct:number;terminalGrowthPct:number;dilutionPct:number;cashDeductionPct:number};
export const CASH_FLOW_PRESETS:Record<'bear'|'base'|'bull',CashFlowAssumptions>={
  bear:{growthPct:-5,discountRatePct:12,terminalGrowthPct:0,dilutionPct:1,cashDeductionPct:0},
  base:{growthPct:0,discountRatePct:10,terminalGrowthPct:2,dilutionPct:1,cashDeductionPct:0},
  bull:{growthPct:5,discountRatePct:9,terminalGrowthPct:2,dilutionPct:1,cashDeductionPct:0},
};
export const VALUATION_METHOD_REFERENCES={
  cashFlow:'https://www.sec.gov/rules-regulations/staff-guidance/corporation-finance-interpretations/non-gaap-financial-measures',
  equityDiscounting:'https://pages.stern.nyu.edu/~adamodar/pdfiles/valn2ed/ch14.pdf',
};
const DAY=86400000;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const positive=(v:unknown):v is number=>finite(v)&&v>0;
const validDate=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const filedSource=(p:ValuationFact|undefined)=>Boolean(p?.source==='SEC'&&p.sourceUrl&&/^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/\d+\//.test(p.sourceUrl)&&p.accession&&/^\d{10}-\d{2}-\d{6}$/.test(p.accession));
const samePeriod=(a:ValuationFact|undefined,b:ValuationFact|undefined)=>Boolean(a&&b&&a.periodStart===b.periodStart&&a.periodEnd===b.periodEnd&&a.accession===b.accession&&a.filedAt===b.filedAt&&a.taxonomy===b.taxonomy);
const supportedModels=new Set(['GENERAL_COMPOUNDER','CONSUMER','INDUSTRIAL','SEMICONDUCTOR_DESIGNER','DEFENSE','SAAS_SOFTWARE','MARKETPLACE_ADTECH','FINTECH_PAYMENTS','DIGITAL_HEALTH_PLATFORM']);

function methodRequirement(model:string,crypto:boolean) {
  if(crypto)return 'Crypto has no company equity cash-flow claim. Use network activity, token supply, liquidity and asset-specific valuation evidence.';
  if(['BANK','INSURER'].includes(model))return 'This financial business needs book value, sustainable return on equity and regulatory capital evidence.';
  if(model==='REIT')return 'This property business needs reported FFO/AFFO, maintenance spending and property/debt evidence.';
  if(['BIOTECH_PHARMA','MEDTECH'].includes(model))return 'This business needs product/pipeline cash-flow scenarios and probability-weighted clinical or commercial evidence.';
  if(['ENERGY','MINER_COMMODITY','SEMICONDUCTOR_MEMORY_CYCLICAL'].includes(model))return 'This cyclical business needs normalized commodity/cycle earnings and sustaining capital evidence.';
  if(['AI_DATA_CENTER_INFRA','POWER_UTILITY_INFRA','NETWORKING_COMPUTE_INFRA'].includes(model))return 'This infrastructure business needs contracted capacity, funding, maintenance capital and segment economics.';
  return 'A supported business classification is required before applying this cash-flow method.';
}

export function extractValuationEvidence(input:ValuationWorkbenchInput) {
  const asOf=input.asOf??new Date().toISOString(),asOfTime=Date.parse(asOf),asOfDay=asOf.slice(0,10);
  const facts=input.company?.evidence??[],cfo=facts.find(x=>x.key==='operatingCashFlow'),capex=facts.find(x=>x.key==='capex'),shareFact=facts.find(x=>x.key==='dilutedShares');
  const model=(input.businessModel??'').toUpperCase();
  const crypto=(input.assetType??'').toUpperCase()==='CRYPTO'||input.symbol.includes('/');
  const supported=!crypto&&supportedModels.has(model),blockingReasons:string[]=[],warnings:string[]=[];
  if(!supported)blockingReasons.push(methodRequirement(model,crypto));
  const datesValid=Boolean(cfo&&validDate(cfo.periodStart)&&validDate(cfo.periodEnd)&&validDate(cfo.filedAt)&&cfo.periodEnd<=asOfDay&&cfo.filedAt<=asOfDay&&Number.isFinite(asOfTime));
  const duration=datesValid?(Date.parse(cfo!.periodEnd!)-Date.parse(cfo!.periodStart!))/DAY+1:null;
  const ageDays=datesValid?(asOfTime-Date.parse(cfo!.periodEnd!))/DAY:null;
  const periodValid=datesValid&&duration!==null&&duration>=330&&duration<=400&&cfo?.scope==='ANNUAL'&&capex?.scope==='ANNUAL'&&samePeriod(cfo,capex);
  const currencyValid=cfo?.currency==='USD'&&capex?.currency==='USD'&&cfo?.unit==='USD'&&capex?.unit==='USD'&&cfo?.basis==='GAAP'&&capex?.basis==='GAAP'&&cfo?.taxonomy==='us-gaap';
  const rawFcf=input.company?.rawMetrics?.fcf;
  const reconciled=finite(cfo?.value)&&finite(capex?.value)?cfo.value-Math.abs(capex.value):null;
  const continuityValid=finite(rawFcf)&&reconciled!==null&&Math.abs(rawFcf-reconciled)<=Math.max(1,Math.abs(reconciled)*1e-10);
  const cashEvidenceValid=periodValid&&currencyValid&&filedSource(cfo)&&filedSource(capex)&&continuityValid;
  const fcf=cashEvidenceValid?reconciled:null;
  if(!cashEvidenceValid)blockingReasons.push('Load matching full-year US GAAP operating cash flow and capex in USD, with filing sources and a comparable continuing-business basis. Partial periods and unconverted currencies are not projected.');
  if(!continuityValid)for(const warning of input.company?.dataQuality?.warnings??[])if(/discontinued|current reporting basis|currency conversion/i.test(warning))blockingReasons.push(warning);
  // Reported consolidated facts remain useful even when they cannot seed a
  // continuing-business projection. Keep this display-only object separate.
  const reportedCfo=facts.find(x=>x.key==='reportedOperatingCashFlow');
  const reportedValid=Boolean(reportedCfo&&finite(reportedCfo.value)&&finite(capex?.value)&&reportedCfo.currency==='USD'&&reportedCfo.unit==='USD'&&capex?.currency==='USD'&&capex?.unit==='USD'&&reportedCfo.basis==='GAAP'&&capex?.basis==='GAAP'&&reportedCfo.scope==='ANNUAL'&&capex?.scope==='ANNUAL'&&samePeriod(reportedCfo,capex)&&filedSource(reportedCfo)&&filedSource(capex)&&validDate(reportedCfo.periodStart)&&validDate(reportedCfo.periodEnd)&&validDate(reportedCfo.filedAt)&&reportedCfo.periodEnd<=asOfDay&&reportedCfo.filedAt<=asOfDay&&(Date.parse(reportedCfo.periodEnd)-Date.parse(reportedCfo.periodStart))/DAY>=329&&(Date.parse(reportedCfo.periodEnd)-Date.parse(reportedCfo.periodStart))/DAY<=399);
  const reportedCashFlow=reportedValid?{operatingCashFlow:reportedCfo!.value!,capex:Math.abs(capex!.value!),fcf:reportedCfo!.value!-Math.abs(capex!.value!),periodStart:reportedCfo!.periodStart!,periodEnd:reportedCfo!.periodEnd!,filedAt:reportedCfo!.filedAt!,sourceUrl:reportedCfo!.sourceUrl!,projectionEligible:cashEvidenceValid&&reportedCfo!.value===cfo!.value}:null;
  if(cashEvidenceValid&&ageDays!==null&&ageDays>550)blockingReasons.push('The annual cash-flow period is more than 18 months old. Load a newer annual filing before estimating a value.');
  if(fcf!==null&&fcf<=0)blockingReasons.push('Reported free cash flow is not positive. A funded path to sustainable positive cash flow is needed; a perpetuity on this starting value would mislead.');
  const shareDatesValid=Boolean(shareFact&&validDate(shareFact.periodEnd)&&validDate(shareFact.filedAt)&&shareFact.periodEnd<=asOfDay&&shareFact.filedAt<=asOfDay);
  const validReportedShares=positive(shareFact?.value)&&shareFact?.unit==='shares'&&shareFact?.scope==='ANNUAL'&&shareFact?.basis==='GAAP'&&samePeriod(cfo??reportedCfo,shareFact)&&shareDatesValid&&filedSource(shareFact);
  const reviewed=input.reviewedShares;
  const validReview=Boolean(reviewed&&positive(reviewed.value)&&validDate(reviewed.asOf)&&reviewed.asOf<=asOfDay&&(asOfTime-Date.parse(reviewed.asOf))/DAY<=550);
  const shares=reviewed?(validReview?reviewed.value:null):(validReportedShares?shareFact!.value!:null);
  const shareBasis=shares===null?null:reviewed?'USER_REVIEWED' as const:'SEC_ANNUAL_DILUTED' as const;
  const sharesAsOf=shares===null?null:reviewed?reviewed.asOf:shareFact!.periodEnd!;
  const providerShares=positive(input.profile?.shareOutstanding)?input.profile.shareOutstanding*1_000_000:null;
  if(shares===null)blockingReasons.push('A dated share denominator is needed. Load matching SEC annual diluted shares, or enter a reviewed share count and its date below. Undated provider shares are not used automatically.');
  if(shareBasis==='SEC_ANNUAL_DILUTED')warnings.push('The denominator is annual weighted-average diluted shares, not current shares outstanding. Review later buybacks, issuance, splits and the listed share class; no ADR ratio conversion is applied.');
  if(shareBasis==='USER_REVIEWED')warnings.push('The share count and date are your inputs, not independently verified source facts.');
  if(ageDays!==null&&ageDays>365)warnings.push('The starting cash flow is an annual filing older than one year, not trailing-twelve-month cash flow.');
  const priceCurrency=input.priceCurrency??input.profile?.currency??null;
  const priceTime=input.priceAsOf?Date.parse(input.priceAsOf):NaN;
  const priceUsable=positive(input.currentPrice)&&priceCurrency==='USD'&&Number.isFinite(priceTime)&&priceTime<=asOfTime&&(asOfTime-priceTime)<=7*DAY;
  if(!priceUsable)warnings.push('Price comparison needs a USD market reference observed within the last seven calendar days. The cash-flow estimate itself does not use the market price.');
  const marketCap=positive(input.profile?.marketCapitalization)&&input.profile?.currency==='USD'?input.profile.marketCapitalization*1_000_000:null;
  const fcfYieldPct=fcf!==null&&marketCap!==null&&ageDays!==null&&ageDays<=550?fcf/marketCap*100:null;
  return {
    supported,blockingReasons,warnings,fcf,reportedCashFlow,currency:'USD' as const,operatingCashFlow:cashEvidenceValid?cfo!.value!:null,capex:cashEvidenceValid?Math.abs(capex!.value!):null,
    periodStart:cashEvidenceValid?cfo!.periodStart!:null,periodEnd:cashEvidenceValid?cfo!.periodEnd!:null,filedAt:cashEvidenceValid?cfo!.filedAt!:null,
    sourceUrl:cashEvidenceValid?cfo!.sourceUrl!:null,shares,sharesAsOf,shareBasis,shareSourceUrl:shareBasis==='SEC_ANNUAL_DILUTED'?shareFact!.sourceUrl!:null,providerShares,
    price:priceUsable?input.currentPrice!:null,priceAsOf:priceUsable?input.priceAsOf!:null,marketCap,fcfYieldPct,
    fcfYieldBasis:fcfYieldPct===null?null:'Annual SEC operating cash flow less capex / Finnhub provider market capitalization (capitalization observation date not supplied). Descriptive yield only.',
  };
}
export type ValuationEvidence=ReturnType<typeof extractValuationEvidence>;
export type CashFlowProjection={year:number;cashFlow:number;shares:number;cashFlowPerShare:number;presentValuePerShare:number};

/** Five year end-of-year cash flows plus a growing perpetuity. No net-debt bridge:
 * US GAAP CFO includes cash interest. Net new borrowing is assumed zero. The
 * deduction input reduces cash available for non-discretionary claims each year.
 * Dilution continues into terminal cash flow; terminal growth is total cash flow.
 */
export function calculateCashFlowScenario(evidence:ValuationEvidence,assumptions:CashFlowAssumptions) {
  const errors=[...evidence.blockingReasons];
  if(!Object.values(assumptions).every(finite))errors.push('Every assumption must be a finite number.');
  if(!(assumptions.growthPct>=-50&&assumptions.growthPct<=50))errors.push('Five-year annual cash-flow growth must be between -50% and 50%.');
  if(!(assumptions.discountRatePct>0&&assumptions.discountRatePct<=50))errors.push('The equity discount rate must be above 0% and no more than 50%.');
  if(!(assumptions.terminalGrowthPct>=-5&&assumptions.terminalGrowthPct<=5))errors.push('Terminal total cash-flow growth must be between -5% and 5%.');
  if(assumptions.terminalGrowthPct>=assumptions.discountRatePct)errors.push('Terminal growth must be below the equity discount rate.');
  if(!(assumptions.dilutionPct>=0&&assumptions.dilutionPct<=25))errors.push('Annual dilution must be between 0% and 25%; perpetual buybacks are not modeled.');
  if(!(assumptions.cashDeductionPct>=0&&assumptions.cashDeductionPct<100))errors.push('The additional cash deduction must be at least 0% and below 100%.');
  const unavailable={status:'UNAVAILABLE' as const,decisionGrade:false as const,estimatePerShare:null,differenceFromPricePct:null,explicitPresentValuePerShare:null,terminalPresentValuePerShare:null,terminalWeightPct:null,projection:[] as CashFlowProjection[],errors};
  if(errors.length||!positive(evidence.fcf)||!positive(evidence.shares))return unavailable;
  const growth=assumptions.growthPct/100,discount=assumptions.discountRatePct/100,terminalGrowth=assumptions.terminalGrowthPct/100,dilution=assumptions.dilutionPct/100;
  let cash=evidence.fcf*(1-assumptions.cashDeductionPct/100),shares=evidence.shares,pv=0;
  const projection:CashFlowProjection[]=[];
  for(let year=1;year<=5;year++) {
    cash*=1+growth;shares*=1+dilution;
    const cashFlowPerShare=cash/shares,presentValuePerShare=cashFlowPerShare/((1+discount)**year);
    pv+=presentValuePerShare;projection.push({year,cashFlow:cash,shares,cashFlowPerShare,presentValuePerShare});
  }
  const terminalPerShareGrowth=(1+terminalGrowth)/(1+dilution)-1;
  const terminalNextCashPerShare=cash*(1+terminalGrowth)/(shares*(1+dilution));
  const terminalPresentValuePerShare=terminalNextCashPerShare/(discount-terminalPerShareGrowth)/((1+discount)**5);
  const estimatePerShare=pv+terminalPresentValuePerShare;
  if(!positive(estimatePerShare)||!finite(terminalPresentValuePerShare))return {...unavailable,errors:['The inputs produce an invalid cash-flow value. Review their scale and assumptions.']};
  return {status:'EXPLORATORY' as const,decisionGrade:false as const,estimatePerShare,differenceFromPricePct:positive(evidence.price)?(estimatePerShare/evidence.price-1)*100:null,explicitPresentValuePerShare:pv,terminalPresentValuePerShare,terminalWeightPct:terminalPresentValuePerShare/estimatePerShare*100,projection,errors};
}
