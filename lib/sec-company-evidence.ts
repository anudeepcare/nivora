/** SEC facts retain their unit, exact period and filing throughout selection and arithmetic. */
type Scope = 'ANNUAL' | 'QUARTER' | 'POINT_IN_TIME';
type Metric = keyof typeof TAGS;
const TAGS = {
  revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet','Revenue','RevenueFromContractsWithCustomers'],
  netIncome:['NetIncomeLoss','ProfitLoss','ProfitLossFromContinuingOperations'],
  continuingNetIncome:['IncomeLossFromContinuingOperations','ProfitLossFromContinuingOperations'],
  discontinuedNetIncome:['IncomeLossFromDiscontinuedOperationsNetOfTax','ProfitLossFromDiscontinuedOperations'],
  cash:['CashAndCashEquivalentsAtCarryingValue','CashAndCashEquivalents'],
  assets:['Assets'],
  liabilities:['Liabilities'],
  operatingCashFlow:['NetCashProvidedByUsedInOperatingActivities','CashFlowsFromUsedInOperatingActivities'],
  continuingOperatingCashFlow:['NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
  discontinuedOperatingCashFlow:['CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations'],
  capex:['PaymentsToAcquirePropertyPlantAndEquipment','PurchaseOfPropertyPlantAndEquipment','PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities'],
  grossProfit:['GrossProfit','GrossProfitLoss'],
  operatingIncome:['OperatingIncomeLoss','ProfitLossFromOperatingActivities'],
};
const ANNUAL_FORMS = new Set(['10-K','10-K/A','20-F','20-F/A','40-F','40-F/A']);
const FORMS = new Set([...ANNUAL_FORMS,'10-Q','10-Q/A','6-K','6-K/A']);
const DAY = 86400000;
export type SecCompanyFact = {
  metric:Metric; value:number; currency:string; unit:string; periodStart:string|null; periodEnd:string;
  filedAt:string; accession:string|null; form:string; concept:string; taxonomy:string; scope:Scope;
  source:'SEC'; sourceUrl:string|null; basis:'GAAP'|'IFRS'; priority:number;
};
const validDate = (v:unknown):v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
const days = (start:string,end:string) => Math.round((Date.parse(end)-Date.parse(start))/DAY)+1;
const clampScore = (value:number) => Math.max(0,Math.min(100,Math.round(value)));
const last = <T>(values:T[]) => values.length?values[values.length-1]:null;
const value = (point:SecCompanyFact|null) => point?.value??null;

function normalizeFacts(payload:any,cik:string,asOf:string) {
  const out:SecCompanyFact[]=[];
  const facts=payload?.facts??payload??{};
  for(const taxonomy of ['us-gaap','ifrs-full']) for(const metric of Object.keys(TAGS) as Metric[]) {
    TAGS[metric].forEach((concept,priority)=>{
      for(const [unit,rows] of Object.entries(facts[taxonomy]?.[concept]?.units??{})) {
        if(!/^[A-Z]{3}$/.test(unit)||!Array.isArray(rows)) continue;
        for(const row of rows) {
          if(typeof row?.val!=='number'||!Number.isFinite(row.val)||!validDate(row.end)||!validDate(row.filed)||row.filed>asOf||row.end>asOf||!FORMS.has(row.form)) continue;
          const start=validDate(row.start)?row.start:null;
          const duration=start?days(start,row.end):null;
          const instant=['cash','assets','liabilities'].includes(metric);
          const scope:Scope|null=instant?(row.start==null?'POINT_IN_TIME':null):duration!=null&&duration>=330&&duration<=400&&ANNUAL_FORMS.has(row.form)?'ANNUAL':duration!=null&&duration>=70&&duration<=110?'QUARTER':null;
          if(!scope)continue;
          const accession=typeof row.accn==='string'&&/^\d{10}-\d{2}-\d{6}$/.test(row.accn)?row.accn:null;
          const numericCik=/^\d+$/.test(cik)?String(Number(cik)):null;
          out.push({metric,value:row.val,currency:unit,unit,periodStart:start,periodEnd:row.end,filedAt:row.filed,accession,form:row.form,concept,taxonomy,scope,source:'SEC',basis:taxonomy==='ifrs-full'?'IFRS':'GAAP',priority,
            sourceUrl:accession&&numericCik?`https://www.sec.gov/Archives/edgar/data/${numericCik}/${accession.replaceAll('-','')}/${accession}-index.html`:null});
        }
      }
    });
  }
  return out;
}

// Fresh periods and restatements outrank concept aliases. USD is only a tie breaker
// between explicitly reported units; no implicit currency conversion is performed.
function rank(a:SecCompanyFact,b:SecCompanyFact) {
  return a.periodEnd.localeCompare(b.periodEnd)||a.filedAt.localeCompare(b.filedAt)||b.priority-a.priority||Number(a.currency==='USD')-Number(b.currency==='USD')||(a.accession??'').localeCompare(b.accession??'')||a.concept.localeCompare(b.concept);
}
function newest(points:SecCompanyFact[]) {return last([...points].sort(rank));}
function series(points:SecCompanyFact[]) {
  const byEnd=new Map<string,SecCompanyFact>();
  for(const point of [...points].sort(rank))byEnd.set(point.periodEnd,point);
  return [...byEnd.values()].sort((a,b)=>a.periodEnd.localeCompare(b.periodEnd));
}
function matches(a:SecCompanyFact|null,b:SecCompanyFact|null):boolean {
  return Boolean(a&&b&&a.scope===b.scope&&a.periodStart===b.periodStart&&a.periodEnd===b.periodEnd&&a.currency===b.currency&&a.taxonomy===b.taxonomy);
}
function sameFiling(a:SecCompanyFact|null,b:SecCompanyFact|null) {
  return Boolean(a&&b&&(a.accession&&b.accession?a.accession===b.accession:a.filedAt===b.filedAt));
}
function periodFact(points:SecCompanyFact[],metric:Metric,anchor:SecCompanyFact|null) {
  return anchor?newest(points.filter(p=>p.metric===metric&&matches(p,anchor)&&sameFiling(p,anchor))):null;
}
function ratio(numerator:SecCompanyFact|null,denominator:SecCompanyFact|null) {
  return matches(numerator,denominator)&&denominator!.value!==0?numerator!.value/denominator!.value*100:null;
}
function comparable(a:SecCompanyFact|null,b:SecCompanyFact|null,points:SecCompanyFact[]) {
  if(!a||!b||a.scope!==b.scope||a.currency!==b.currency||a.taxonomy!==b.taxonomy||!a.periodStart||!b.periodStart)return false;
  const yearGap=days(b.periodEnd,a.periodEnd)-1;
  if(yearGap<330||yearGap>400||Math.abs(days(a.periodStart,a.periodEnd)-days(b.periodStart,b.periodEnd))>14)return false;
  if(a.concept===b.concept)return true;
  // A concept transition is bridged only when the current concept also reports
  // the comparison period with the same value, unit and accounting taxonomy.
  return points.some(p=>p.metric===a.metric&&p.concept===a.concept&&matches(p,b)&&p.value===b.value);
}
function growth(current:SecCompanyFact|null,prior:SecCompanyFact|null,points:SecCompanyFact[]) {
  return comparable(current,prior,points)&&prior!.value>0?(current!.value/prior!.value-1)*100:null;
}
function priorPeriod(points:SecCompanyFact[],current:SecCompanyFact|null) {
  if(!current)return null;
  return newest(points.filter(p=>p.metric===current.metric&&p.periodEnd<current.periodEnd&&comparable(current,p,points)));
}
function trend(values:number[]) {
  if(values.length<2)return 'Limited';
  let up=0,down=0;
  for(let i=1;i<values.length;i++){if(values[i]>values[i-1])up++;else if(values[i]<values[i-1])down++;}
  return up>=Math.max(2,values.length-2)?'Strong':up>down?'Improving':down>up?'Weakening':'Mixed';
}
function money(amount:number,currency:string) {
  const n=Math.abs(amount),sign=amount<0?'-':'',prefix=currency==='USD'?'$':`${currency} `;
  return `${sign}${prefix}${n>=1e12?`${(n/1e12).toFixed(2)}T`:n>=1e9?`${(n/1e9).toFixed(2)}B`:n>=1e6?`${(n/1e6).toFixed(1)}M`:Math.round(n).toLocaleString('en-US')}`;
}
function evidence(key:string,point:SecCompanyFact) {
  const {priority,metric,...rest}=point;
  return {key,...rest,period:point.scope==='POINT_IN_TIME'?point.periodEnd:`${point.periodStart} – ${point.periodEnd}`};
}

// Shares are a count, not a monetary fact. Keep their unit separate and only
// pair the annual diluted denominator with the exact cash-flow filing/period.
function annualDilutedShareEvidence(payload:any,anchor:SecCompanyFact|null,asOf:string) {
  if(!anchor||anchor.taxonomy!=='us-gaap'||anchor.scope!=='ANNUAL'||!anchor.accession||!anchor.sourceUrl)return null;
  const concept='WeightedAverageNumberOfDilutedSharesOutstanding';
  const rows=(payload?.facts??payload??{})['us-gaap']?.[concept]?.units?.shares;
  if(!Array.isArray(rows))return null;
  const matched=rows.filter((row:any)=>typeof row?.val==='number'&&Number.isFinite(row.val)&&row.val>0&&row.start===anchor.periodStart&&row.end===anchor.periodEnd&&row.accn===anchor.accession&&row.filed===anchor.filedAt&&validDate(row.filed)&&row.filed<=asOf&&row.end<=asOf&&ANNUAL_FORMS.has(row.form));
  if(!matched.length||new Set(matched.map((row:any)=>row.val)).size!==1)return null;
  return {key:'dilutedShares',value:matched[0].val,currency:null,unit:'shares',periodStart:anchor.periodStart,periodEnd:anchor.periodEnd,filedAt:anchor.filedAt,accession:anchor.accession,form:anchor.form,concept,taxonomy:'us-gaap',scope:'ANNUAL' as const,source:'SEC' as const,basis:'GAAP' as const,sourceUrl:anchor.sourceUrl,period:`${anchor.periodStart} – ${anchor.periodEnd}`};
}

export function buildSecCompanyEvidence(payload:any,options:{cik?:string;asOf?:string}={}) {
  const points=normalizeFacts(payload,options.cik??'',(options.asOf??new Date().toISOString()).slice(0,10));
  const annual=points.filter(p=>p.scope==='ANNUAL');
  const quarters=points.filter(p=>p.scope==='QUARTER');
  const instants=points.filter(p=>p.scope==='POINT_IN_TIME');
  const revenueSeries=series(annual.filter(p=>p.metric==='revenue'));
  const annualRevenue=last(revenueSeries);
  const quarterRevenue=newest(quarters.filter(p=>p.metric==='revenue'));
  const currentReporter=newest(points.filter(p=>p.metric==='revenue'))??newest(points);
  const reportedCurrency=currentReporter?.currency??null;
  const currentBasis=(p:SecCompanyFact|null)=>Boolean(p&&currentReporter&&p.currency===currentReporter.currency&&p.taxonomy===currentReporter.taxonomy);
  const annualAnchor=annualRevenue??newest(annual);
  const discontinuedAt=(anchor:SecCompanyFact|null)=>['discontinuedNetIncome','discontinuedOperatingCashFlow'].some(metric=>{
    const p=periodFact(points,metric as Metric,anchor);return p!==null&&p.value!==0;
  });
  const businessFact=(metric:'netIncome'|'operatingCashFlow',anchor:SecCompanyFact|null)=>{
    const continuing=periodFact(points,metric==='netIncome'?'continuingNetIncome':'continuingOperatingCashFlow',anchor);
    return continuing??(discontinuedAt(anchor)?null:periodFact(points,metric,anchor));
  };
  const reportedNetIncome=periodFact(annual,'netIncome',annualAnchor);
  const annualNetIncome=businessFact('netIncome',annualAnchor);
  const reportedOperatingCashFlow=periodFact(annual,'operatingCashFlow',annualAnchor);
  const operatingCashFlow=businessFact('operatingCashFlow',annualAnchor);
  const capex=periodFact(annual,'capex',annualAnchor);
  const operatingIncome=periodFact(annual,'operatingIncome',annualAnchor);
  const grossProfit=periodFact(annual,'grossProfit',annualAnchor);
  const instantAnchor=newest(instants.filter(p=>currentBasis(p)));
  const cash=periodFact(instants,'cash',instantAnchor);
  const assets=periodFact(instants,'assets',instantAnchor);
  const liabilities=periodFact(instants,'liabilities',instantAnchor);
  const reportedFcf=matches(reportedOperatingCashFlow,capex)?reportedOperatingCashFlow!.value-Math.abs(capex!.value):null;
  // Standard capex tags do not distinguish disposal groups. A continuing CFO
  // cannot be combined with consolidated capex when discontinued activity exists.
  const fcf=!discontinuedAt(annualAnchor)&&matches(operatingCashFlow,capex)?operatingCashFlow!.value-Math.abs(capex!.value):null;
  const revGrowth=growth(annualRevenue,priorPeriod(annual,annualRevenue),annual);
  const niGrowth=growth(annualNetIncome,priorPeriod(annual,annualNetIncome),annual);
  const opMargin=ratio(operatingIncome,annualRevenue),grossMargin=ratio(grossProfit,annualRevenue),leverage=ratio(liabilities,assets);
  const reportedMetrics={currency:annualAnchor?.currency??reportedCurrency,revenue:value(annualRevenue),revGrowth,netIncome:value(reportedNetIncome),continuingNetIncome:annualNetIncome?.metric==='continuingNetIncome'?annualNetIncome.value:null,niGrowth,fcf:reportedFcf,operatingCashFlow:value(reportedOperatingCashFlow),continuingOperatingCashFlow:operatingCashFlow?.metric==='continuingOperatingCashFlow'?operatingCashFlow.value:null,opMargin,grossMargin,leverage};
  // The investment engines' monetary contract is USD. Missing FX normalization is
  // missing coverage, never permission to relabel a foreign-currency amount.
  const annualUsable=currentBasis(annualAnchor)&&annualAnchor?.currency==='USD';
  const rawMetrics={revenue:annualUsable?value(annualRevenue):null,revGrowth:annualUsable?revGrowth:null,niGrowth:annualUsable?niGrowth:null,netIncome:annualUsable?value(annualNetIncome):null,fcf:annualUsable?fcf:null,opMargin:annualUsable?opMargin:null,grossMargin:annualUsable?grossMargin:null,leverage:instantAnchor?.currency==='USD'?leverage:null};

  const qNet=businessFact('netIncome',quarterRevenue),qOp=periodFact(quarters,'operatingIncome',quarterRevenue),qGross=periodFact(quarters,'grossProfit',quarterRevenue);
  const latestQuarter=quarterRevenue?{period:`Quarter ended ${quarterRevenue.periodEnd}`,periodStart:quarterRevenue.periodStart,periodEnd:quarterRevenue.periodEnd,filedAt:quarterRevenue.filedAt,currency:quarterRevenue.currency,unit:quarterRevenue.unit,accession:quarterRevenue.accession,sourceUrl:quarterRevenue.sourceUrl,revenue:quarterRevenue.value,revenueGrowth:growth(quarterRevenue,priorPeriod(quarters,quarterRevenue),quarters),netIncome:value(qNet),opMargin:ratio(qOp,quarterRevenue),grossMargin:ratio(qGross,quarterRevenue)}:null;
  const dilutedShares=annualDilutedShareEvidence(payload,operatingCashFlow??reportedOperatingCashFlow,(options.asOf??new Date().toISOString()).slice(0,10));
  const evidenceRows=[annualRevenue&&evidence('revenue',annualRevenue),annualNetIncome&&evidence('netIncome',annualNetIncome),reportedNetIncome&&evidence('reportedNetIncome',reportedNetIncome),operatingCashFlow&&evidence('operatingCashFlow',operatingCashFlow),reportedOperatingCashFlow&&evidence('reportedOperatingCashFlow',reportedOperatingCashFlow),capex&&evidence('capex',capex),cash&&evidence('cash',cash),assets&&evidence('assets',assets),liabilities&&evidence('liabilities',liabilities),operatingIncome&&evidence('operatingIncome',operatingIncome),grossProfit&&evidence('grossProfit',grossProfit),quarterRevenue&&evidence('quarterRevenue',quarterRevenue),qNet&&evidence('quarterNetIncome',qNet),dilutedShares].filter((p):p is NonNullable<typeof p>=>p!==null);

  // Historical rows retain original currencies but only a continuous, comparable
  // current reporting cohort is eligible for growth and durability scoring.
  const historyAnchors=(revenueSeries.length?revenueSeries:series(annual.filter(p=>p.metric==='netIncome'))).slice(-5);
  let cohortStart=historyAnchors.length;
  if(currentBasis(last(historyAnchors))){
    cohortStart=Math.max(0,historyAnchors.length-1);
    while(cohortStart>0&&comparable(historyAnchors[cohortStart],historyAnchors[cohortStart-1],annual))cohortStart--;
  }
  const hasDiscontinuedReporting=annual.some(p=>['discontinuedNetIncome','discontinuedOperatingCashFlow'].includes(p.metric)&&p.value!==0&&sameFiling(p,annualAnchor));
  const history=historyAnchors.map((anchor,index)=>{
    const rev=periodFact(annual,'revenue',anchor),ni=businessFact('netIncome',anchor),ocf=businessFact('operatingCashFlow',anchor);
    return {year:anchor.periodEnd.slice(0,4),periodStart:anchor.periodStart,periodEnd:anchor.periodEnd,filedAt:anchor.filedAt,currency:anchor.currency,unit:anchor.unit,comparable:index>=cohortStart&&(!hasDiscontinuedReporting||sameFiling(anchor,annualAnchor)),revenue:value(rev),netIncome:value(ni),reportedNetIncome:value(periodFact(annual,'netIncome',anchor)),earningsBasis:ni?.metric==='continuingNetIncome'?'CONTINUING_OPERATIONS':ni?'REPORTED':'UNAVAILABLE',operatingCashFlow:value(ocf),cashFlowBasis:ocf?.metric==='continuingOperatingCashFlow'?'CONTINUING_OPERATIONS':ocf?'REPORTED':'UNAVAILABLE',evidence:[rev&&evidence('revenue',rev),ni&&evidence('netIncome',ni),ocf&&evidence('operatingCashFlow',ocf)].filter(Boolean)};
  });
  const comparableHistory=history.every(p=>p.comparable);
  const currentHistory=history.filter(p=>p.comparable);
  const revenueValues=currentHistory.map(p=>p.revenue).filter((v):v is number=>v!==null),incomeValues=currentHistory.map(p=>p.netIncome).filter((v):v is number=>v!==null),cashValues=currentHistory.map(p=>p.operatingCashFlow).filter((v):v is number=>v!==null);
  const revenueTrend=trend(revenueValues),profitTrend=trend(incomeValues);
  const profitableYears=incomeValues.length?incomeValues.filter(v=>v>0).length/incomeValues.length:null;
  const positiveCashYears=cashValues.length?cashValues.filter(v=>v>0).length/cashValues.length:null;
  let fiveScore=50;
  if(revenueTrend==='Strong')fiveScore+=18;else if(revenueTrend==='Improving')fiveScore+=10;else if(revenueTrend==='Weakening')fiveScore-=12;
  if(profitableYears!==null)fiveScore+=(profitableYears-.5)*28;
  if(positiveCashYears!==null)fiveScore+=(positiveCashYears-.5)*18;
  if(currentBasis(annualAnchor)&&opMargin!==null)fiveScore+=Math.max(-10,Math.min(12,(opMargin-8)*.7));
  if(leverage!==null)fiveScore+=leverage<55?8:leverage>85?-10:0;
  const fiveYearRecord={score:currentHistory.length>=2?clampScore(fiveScore):null,years:history.length,comparableYears:currentHistory.length,revenueTrend,profitTrend,profitableYears:profitableYears===null?null:Math.round(profitableYears*100),positiveCashYears:positiveCashYears===null?null:Math.round(positiveCashYears*100),history,
    summary:!comparableHistory?'Historical reporting currencies or accounting bases changed. Earlier rows are shown as reported and excluded from current-business growth and durability.':currentHistory.length<3?'Limited comparable long-term filing history is available.':revenueTrend==='Strong'&&profitableYears!==null&&profitableYears>=.6?'Revenue history is strong and profitability has been relatively consistent.':revenueTrend==='Weakening'?'The comparable multi-year revenue record is weakening and deserves closer review.':'The comparable business record is mixed; use current fundamentals and catalysts for context.'};

  const fundamentals:Array<Record<string,unknown>>=[];
  const addAmount=(label:string,point:SecCompanyFact|null,detail?:string)=>{if(point)fundamentals.push({label,value:money(point.value,point.currency),detail,currency:point.currency,periodStart:point.periodStart,periodEnd:point.periodEnd,filedAt:point.filedAt,accession:point.accession,sourceUrl:point.sourceUrl});};
  const growthLabel=(v:number|null)=>v===null?undefined:`${v>=0?'+':''}${v.toFixed(1)}% YoY`;
  addAmount(`Year ended ${annualRevenue?.periodEnd??'—'} revenue`,annualRevenue,growthLabel(revGrowth));
  addAmount(`Year ended ${annualNetIncome?.periodEnd??'—'} ${annualNetIncome?.metric==='continuingNetIncome'?'continuing-operations ':''}net income`,annualNetIncome,growthLabel(niGrowth));
  if(reportedNetIncome&&(!annualNetIncome||reportedNetIncome.value!==annualNetIncome.value))addAmount(`Year ended ${reportedNetIncome.periodEnd} reported total net income`,reportedNetIncome,'Reported consolidated amount; current-business profitability uses separately verified continuing-operations evidence.');
  if(fcf!==null&&operatingCashFlow)fundamentals.push({label:'Free cash flow',value:money(fcf,operatingCashFlow.currency),detail:fcf>0?'Positive':'Negative',currency:operatingCashFlow.currency,periodStart:operatingCashFlow.periodStart,periodEnd:operatingCashFlow.periodEnd,filedAt:[operatingCashFlow.filedAt,capex!.filedAt].sort().at(-1),basis:'Operating cash flow less capital expenditure',evidence:[evidence('operatingCashFlow',operatingCashFlow),evidence('capex',capex!)]});
  if(fcf===null&&reportedFcf!==null&&reportedOperatingCashFlow)fundamentals.push({label:'Reported consolidated free cash flow',value:money(reportedFcf,reportedOperatingCashFlow.currency),detail:'Includes discontinued activity; excluded from current-business valuation.',currency:reportedOperatingCashFlow.currency,periodStart:reportedOperatingCashFlow.periodStart,periodEnd:reportedOperatingCashFlow.periodEnd,filedAt:reportedOperatingCashFlow.filedAt,evidence:[evidence('reportedOperatingCashFlow',reportedOperatingCashFlow),evidence('capex',capex!)]});
  addAmount('Cash & equivalents',cash);
  if(opMargin!==null)fundamentals.push({label:'Operating margin',value:`${opMargin.toFixed(1)}%`,periodStart:annualRevenue?.periodStart,periodEnd:annualRevenue?.periodEnd});
  if(grossMargin!==null)fundamentals.push({label:'Gross margin',value:`${grossMargin.toFixed(1)}%`,periodStart:annualRevenue?.periodStart,periodEnd:annualRevenue?.periodEnd});
  if(leverage!==null)fundamentals.push({label:'Liabilities / assets',value:`${leverage.toFixed(1)}%`,periodEnd:assets?.periodEnd});

  const reasons:string[]=[],positiveReasons:string[]=[],riskReasons:string[]=[];
  let currentScore=0,observations=0;
  const add=(amount:number,reason:string)=>{currentScore+=amount;reasons.push(reason);(amount>0?positiveReasons:riskReasons).push(reason);};
  if(currentBasis(annualAnchor)) {
    if(revGrowth!==null){observations++;if(revGrowth>15)add(2,'Revenue growth is strong.');else if(revGrowth>0)add(1,'Revenue is growing.');else if(revGrowth<0)add(-1,'Revenue growth is negative.');}
    if(annualNetIncome){observations++;if(annualNetIncome.value>0)add(1,'The company is profitable on the latest comparable annual filing.');else if(annualNetIncome.value<0)add(-1,'Latest comparable annual net income is negative.');}
    if(fcf!==null){observations++;if(fcf>0)add(1,'Free cash flow is positive.');else if(fcf<0)add(-1,'Free cash flow is negative.');}
    if(opMargin!==null){observations++;if(opMargin>12)add(1,'Operating margin is healthy.');}
  }
  if(leverage!==null){observations++;if(leverage<65)add(1,'Balance-sheet leverage is moderate.');else if(leverage>85)add(-1,'Liabilities are high relative to assets.');}
  if(matches(cash,liabilities)&&cash!.value>liabilities!.value*.25){observations++;add(1,'Cash provides a meaningful balance-sheet cushion.');}
  const currentFundamentalScore=observations?clampScore(50+currentScore*8):null;
  const businessScore=currentFundamentalScore===null?fiveYearRecord.score:fiveYearRecord.score===null?currentFundamentalScore:clampScore(currentFundamentalScore*.45+fiveYearRecord.score*.55);
  const fundamentalSignal={label:businessScore===null?'Limited':businessScore>=72?'Strong':businessScore<45?'Weak / watch':'Mixed',tone:businessScore===null?'neutral':businessScore>=72?'good':businessScore<45?'bad':'mid',score:businessScore,currentScore:currentFundamentalScore,reasons,positiveReasons,riskReasons};
  const warnings:string[]=[];
  if(reportedCurrency&&reportedCurrency!=='USD')warnings.push(`Financial statements are reported in ${reportedCurrency}. USD valuation inputs are unavailable because no verified currency conversion is applied.`);
  if(!comparableHistory)warnings.push('Reporting currency, taxonomy, concept or annual coverage changed. Prior reporting periods may describe a different business basis; unbridged periods are excluded from growth and durability.');
  if(hasDiscontinuedReporting)warnings.push('Discontinued operations are present. Current-business profitability and cash-generation use continuing-operations facts; only periods in the latest comparable reporting cohort support durability. Consolidated FCF is excluded from valuation when continuing capex cannot be verified.');
  if(annualAnchor&&!currentBasis(annualAnchor))warnings.push('The latest annual statements do not match the current reporting basis. Current annual valuation and quality inputs are unavailable.');
  if(!annualRevenue)warnings.push('No verified full-year revenue period is available. Partial-year disclosures are not annualized.');
  if(!quarterRevenue)warnings.push('No verified standalone quarter is available. Year-to-date disclosures are not treated as quarterly results.');
  const available=Object.values(rawMetrics).filter(v=>v!==null).length,total=Object.keys(rawMetrics).length;
  if(available<total)warnings.push('Some metrics lack matching periods, currencies or source facts. Missing evidence lowers coverage, not business quality.');
  const dataQuality={contractVersion:'sec-company-evidence-v3',status:available===0?'UNAVAILABLE':available>=6?'SUFFICIENT':'PARTIAL',reportedCurrency,valuationCurrency:'USD',earningsBasis:annualNetIncome?.metric==='continuingNetIncome'?'CONTINUING_OPERATIONS':annualNetIncome?'REPORTED':'UNAVAILABLE',cashFlowBasis:operatingCashFlow?.metric==='continuingOperatingCashFlow'?'CONTINUING_OPERATIONS':operatingCashFlow?'REPORTED':'UNAVAILABLE',comparableHistory,warnings,coverage:{available,total,percent:Math.round(available/total*100)},latestPeriodEnd:currentReporter?.periodEnd??null,latestFiledAt:currentReporter?.filedAt??null};
  return {evidence:evidenceRows,latestQuarter,fundamentals,fundamentalSignal,fiveYearRecord,rawMetrics,reportedMetrics,dataQuality};
}
