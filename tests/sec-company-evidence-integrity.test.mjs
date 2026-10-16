import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve('.');

const annual = (year, val, extra = {}) => ({start:`${year}-01-01`, end:`${year}-12-31`, val, form:'10-K', filed:`${year+1}-02-15`, fy:year, fp:'FY', accn:`0000000001-${String(year+1).slice(-2)}-000001`, ...extra});
const quarter = (year, val, extra = {}) => ({start:`${year}-07-01`, end:`${year}-09-30`, val, form:'10-Q', filed:`${year}-11-01`, fy:year, fp:'Q3', accn:`0000000001-${String(year).slice(-2)}-000003`, ...extra});
const concept = (rows, currency='USD') => ({units:{[currency]:rows}});
const payload = (facts) => ({facts:{'us-gaap':facts}});

// Exercise the real route and its fact-selection code; only the SEC transport is replaced.
async function company(facts,symbol='TEST',secHeaders=[]) {
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = {exports:{}}; modules.set(filename,module);
    const compiled = ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
    const localRequire = (name) => {
      if (name === '@/lib/shared-cache') return {nowIso:()=> '2026-10-16T12:00:00Z', sharedJson:async(url,_tags,_ttl,_timeout,headers)=>{secHeaders.push(headers);return url.includes('company_tickers')?{0:{ticker:'TEST',cik_str:1,title:'Test Company'}}:url.includes('companyfacts')?facts:{filings:{recent:{}}};}};
      if(name.startsWith('@/')) return load(path.join(root,name.slice(2)+'.ts'));
      if(name.startsWith('.')) return load(path.resolve(path.dirname(filename),name)+'.ts');
      return require(name);
    };
    vm.runInNewContext(compiled, {module,exports:module.exports,require:localRequire,process:{env:{SEC_USER_AGENT:'AURYN integrity test research@example.com'}},console,Date,Map,Set,URL,Request,Response}, {filename});
    return module.exports;
  }
  const response=await load(path.join(root,'app/api/company/[symbol]/route.ts')).GET(new Request(`http://localhost/api/company/${encodeURIComponent(symbol)}`), {params:Promise.resolve({symbol})});
  return response.json();
}

test('preserves a reported non-USD currency and withholds USD valuation inputs', async()=>{
  const c=await company(payload({Revenues:concept([annual(2024,800_130_000_000),annual(2025,900_000_000_000)],'RUB'),NetCashProvidedByUsedInOperatingActivities:concept([annual(2025,50_000_000_000)],'RUB'),PaymentsToAcquirePropertyPlantAndEquipment:concept([annual(2025,10_000_000_000)],'RUB')}));
  assert.equal(c.rawMetrics.revenue,null);
  assert.equal(c.rawMetrics.fcf,null);
  assert.equal(c.fiveYearRecord.history.at(-1).currency,'RUB');
  assert.match(c.fundamentals.find(x=>x.label.includes('revenue')).value,/RUB/);
  assert.doesNotMatch(c.fundamentals.find(x=>x.label.includes('revenue')).value,/\$/);
});

test('prefers a newer revenue concept over obsolete first-priority tags', async()=>{
  const c=await company(payload({RevenueFromContractWithCustomerExcludingAssessedTax:concept([annual(2022,90)]),Revenues:concept([annual(2024,180),annual(2025,210)])}));
  assert.equal(c.rawMetrics.revenue,210);
  assert.equal(c.evidence.find(x=>x.key==='revenue').concept,'Revenues');
});

test('a quarterly fact inside an annual filing cannot become annual revenue', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,1000),annual(2025,400,{start:'2025-10-01',filed:'2026-03-01'})])}));
  assert.equal(c.rawMetrics.revenue,1000);
  assert.equal(c.evidence.find(x=>x.key==='revenue').periodStart,'2025-01-01');
});

test('quarter selection rejects YTD values and prior-year comparisons with a different duration', async()=>{
  const c=await company(payload({Revenues:concept([quarter(2024,200),quarter(2025,300),quarter(2025,900,{start:'2025-01-01',filed:'2025-11-02'})])}));
  assert.equal(c.latestQuarter.revenue,300);
  assert.equal(c.latestQuarter.revenueGrowth,50);
  assert.equal(c.latestQuarter.periodStart,'2025-07-01');
});

test('YTD-only disclosure remains unavailable as a standalone quarter or annual amount', async()=>{
  const c=await company(payload({Revenues:concept([quarter(2025,900,{start:'2025-01-01'})])}));
  assert.equal(c.latestQuarter,null);
  assert.equal(c.rawMetrics.revenue,null);
});

test('restated periods use the latest filing independent of input order and retain provenance', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,125,{form:'10-K/A',filed:'2026-04-01',accn:'0000000001-26-000002'}),annual(2025,100)])}));
  assert.equal(c.rawMetrics.revenue,125);
  const e=c.evidence.find(x=>x.key==='revenue');
  assert.equal(e.filedAt,'2026-04-01'); assert.equal(e.accession,'0000000001-26-000002');
  assert.match(e.sourceUrl,/000000000126000002/);
});

test('ratios and cash flow never combine different annual periods or currencies', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,100)]),OperatingIncomeLoss:concept([annual(2024,10)]),GrossProfit:concept([annual(2025,50)],'EUR'),NetCashProvidedByUsedInOperatingActivities:concept([annual(2025,20)]),PaymentsToAcquirePropertyPlantAndEquipment:concept([annual(2024,5)])}));
  assert.equal(c.rawMetrics.opMargin,null); assert.equal(c.rawMetrics.grossMargin,null); assert.equal(c.rawMetrics.fcf,null);
});

test('current assets and current liabilities are not substituted for total balance-sheet fields', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,100)]),AssetsCurrent:concept([{end:'2025-12-31',val:100,form:'10-K',filed:'2026-02-15'}]),Liabilities:concept([{end:'2025-12-31',val:80,form:'10-K',filed:'2026-02-15'}])}));
  assert.equal(c.rawMetrics.leverage,null);
});

test('currency and reporting-basis changes do not manufacture predecessor growth or five-year durability', async()=>{
  const c=await company(payload({RevenueFromContractWithCustomerExcludingAssessedTax:{units:{RUB:[annual(2023,800_130_000_000)],USD:[annual(2024,120_000_000),annual(2025,160_000_000)]}}}));
  assert.equal(c.rawMetrics.revenue,160_000_000);
  assert.ok(Math.abs(c.rawMetrics.revGrowth-100/3)<1e-8);
  assert.equal(c.dataQuality.comparableHistory,false);
  assert.equal(c.fiveYearRecord.comparableYears,2);
  assert.equal(c.fiveYearRecord.history[0].comparable,false);
  assert.match(c.dataQuality.warnings.join(' '),/comparab|currency/i);
});

test('growth is withheld across an unbridged concept or currency transition', async()=>{
  const c=await company(payload({Revenues:concept([annual(2024,900_000_000)],'RUB'),RevenueFromContractWithCustomerExcludingAssessedTax:concept([annual(2025,100_000_000)])}));
  assert.equal(c.rawMetrics.revGrowth,null);
  assert.equal(c.fiveYearRecord.revenueTrend,'Limited');
});

test('missing financial evidence lowers coverage without creating bearish scores', async()=>{
  const c=await company(payload({}));
  assert.equal(c.fiveYearRecord.score,null);
  assert.equal(c.fiveYearRecord.profitableYears,null);
  assert.equal(c.fundamentalSignal.score,null);
  assert.equal(c.fundamentalSignal.tone,'neutral');
  assert.equal(c.dataQuality.coverage.percent,0);
});

test('reported fiscal year is derived from the fact period, not a later filing context', async()=>{
  const c=await company(payload({Revenues:concept([annual(2024,100,{fy:2025,filed:'2026-02-15'})])}));
  assert.match(c.fundamentals[0].label,/2024/);
  assert.equal(c.evidence.find(x=>x.key==='revenue').periodEnd,'2024-12-31');
});

test('a restated revenue period cannot mix with earnings from the superseded filing', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,80,{filed:'2026-04-01',accn:'0000000001-26-000002'})]),OperatingIncomeLoss:concept([annual(2025,20)])}));
  assert.equal(c.rawMetrics.opMargin,null);
});

test('discontinued earnings cannot imply continuing-business profitability', async()=>{
  const c=await company(payload({Revenues:concept([annual(2024,100),annual(2025,120)]),NetIncomeLoss:concept([annual(2024,50),annual(2025,60)]),IncomeLossFromContinuingOperations:concept([annual(2024,-10),annual(2025,-20)]),IncomeLossFromDiscontinuedOperationsNetOfTax:concept([annual(2024,60),annual(2025,80)])}));
  assert.equal(c.rawMetrics.netIncome,-20);
  assert.equal(c.reportedMetrics.netIncome,60);
  assert.equal(c.dataQuality.earningsBasis,'CONTINUING_OPERATIONS');
  assert.doesNotMatch(c.fundamentalSignal.positiveReasons.join(' '),/profitable/);
  assert.equal(c.fiveYearRecord.profitableYears,0);
});

test('discontinued cash flow is withheld from current-business FCF without a matching continuing capex basis', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,100)]),NetCashProvidedByUsedInOperatingActivities:concept([annual(2025,60)]),NetCashProvidedByUsedInOperatingActivitiesContinuingOperations:concept([annual(2025,-20)]),CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations:concept([annual(2025,80)]),PaymentsToAcquirePropertyPlantAndEquipment:concept([annual(2025,5)])}));
  assert.equal(c.rawMetrics.fcf,null);
  assert.equal(c.reportedMetrics.fcf,55);
  assert.equal(c.fiveYearRecord.history.at(-1).operatingCashFlow,-20);
  assert.equal(c.fiveYearRecord.positiveCashYears,0);
});

test('a changed reporting cohort excludes predecessor years absent from the latest restatement', async()=>{
  const latest={filed:'2026-04-30',accn:'0000000001-26-000002'};
  const c=await company(payload({Revenues:{units:{RUB:[annual(2021,1000)],USD:[annual(2022,50),annual(2023,10,latest),annual(2024,90,latest),annual(2025,530,latest)]}},IncomeLossFromDiscontinuedOperationsNetOfTax:concept([annual(2025,70,latest)])}));
  assert.equal(c.fiveYearRecord.comparableYears,3);
  assert.equal(c.fiveYearRecord.history.find(x=>x.year==='2022').comparable,false);
  assert.match(c.dataQuality.warnings.join(' '),/discontinued/i);
});

test('all company responses identify the currency-safe evidence contract including no-match and crypto', async()=>{
  for(const symbol of ['TEST','MISSING','BTC/USD']) {
    const c=await company(payload({}),symbol);
    assert.equal(c.dataQuality.contractVersion,'sec-company-evidence-v3',symbol);
    assert.equal(c.rawMetrics.revenue,null,symbol);
    assert.equal(c.dataQuality.coverage.percent,0,symbol);
  }
});

test('actual NBIS SEC facts retain RUB predecessor history and the latest USD continuing-operation cohort', async()=>{
  const facts=JSON.parse(fs.readFileSync('tests/fixtures/nbis-sec-companyfacts-reported.json','utf8'));
  const c=await company(facts);
  assert.equal(c.rawMetrics.revenue,529_800_000);
  assert.equal(c.rawMetrics.netIncome,9_800_000);
  assert.equal(c.reportedMetrics.netIncome,82_500_000);
  assert.equal(c.rawMetrics.fcf,null);
  assert.equal(c.reportedMetrics.fcf,-3_681_200_000);
  assert.equal(c.fiveYearRecord.comparableYears,3);
  assert.equal(c.fiveYearRecord.profitableYears,33);
  assert.equal(c.fiveYearRecord.positiveCashYears,33);
  assert.deepEqual(c.fiveYearRecord.history.filter(x=>x.comparable).map(x=>[x.year,x.revenue,x.netIncome]),[['2023',9_800_000,-299_000_000],['2024',91_500_000,-352_000_000],['2025',529_800_000,9_800_000]]);
  assert.equal(c.fiveYearRecord.history[0].currency,'RUB');
  assert.equal(c.fiveYearRecord.history[0].comparable,false);
  assert.equal(c.latestQuarter,null);
  assert.equal(c.evidence.find(x=>x.key==='revenue').filedAt,'2026-04-30');
});

test('SEC requests use the configured fair-access user agent', async()=>{
  const headers=[];
  await company(payload({}),'TEST',headers);
  assert.equal(headers.length,3);
  assert.ok(headers.every(x=>x['User-Agent']==='AURYN integrity test research@example.com'));
});

test('history does not claim a reporting basis for unavailable earnings or cash flow', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,100)])}));
  assert.equal(c.fiveYearRecord.history[0].earningsBasis,'UNAVAILABLE');
  assert.equal(c.fiveYearRecord.history[0].cashFlowBasis,'UNAVAILABLE');
});

test('equal continuing and reported earnings do not invent a discontinued-operations adjustment', async()=>{
  const c=await company(payload({Revenues:concept([annual(2025,100)]),NetIncomeLoss:concept([annual(2025,20)]),IncomeLossFromContinuingOperations:concept([annual(2025,20)])}));
  assert.equal(c.fundamentals.filter(x=>x.label.includes('net income')).length,1);
  assert.ok(c.fundamentals.every(x=>!String(x.detail??'').includes('Includes discontinued')));
});
