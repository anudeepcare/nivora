import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';

function load(relative) {
  const file=new URL(relative,import.meta.url);
  if(!existsSync(file))return {};
  const compiled=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};new Function('module','exports',compiled)(module,module.exports);return module.exports;
}
const {buildSecCompanyEvidence}=load('../lib/sec-company-evidence.ts');
const workbench=load('../lib/research-valuation-workbench.ts');
const annual=(val,extra={})=>({val,start:'2025-01-01',end:'2025-12-31',filed:'2026-02-15',form:'10-K',accn:'0000000001-26-000001',...extra});
const concept=(rows,unit='USD')=>({units:{[unit]:rows}});
const facts=(shareRows=[annual(100_000_000)],extra={})=>({facts:{'us-gaap':{
  Revenues:concept([annual(1_000_000_000)]),
  NetCashProvidedByUsedInOperatingActivities:concept([annual(300_000_000)]),
  PaymentsToAcquirePropertyPlantAndEquipment:concept([annual(100_000_000)]),
  WeightedAverageNumberOfDilutedSharesOutstanding:concept(shareRows,'shares'),...extra,
}}});
const company=(payload=facts())=>buildSecCompanyEvidence(payload,{cik:'1',asOf:'2026-10-16'});
const input=(extra={})=>({symbol:'APP',businessModel:'MARKETPLACE_ADTECH',company:company(),currentPrice:30,priceAsOf:'2026-10-16T12:00:00Z',profile:{currency:'USD',marketCapitalization:3000,shareOutstanding:100},asOf:'2026-10-16T12:00:00Z',...extra});
const assumptions={growthPct:0,discountRatePct:10,terminalGrowthPct:0,dilutionPct:0,cashDeductionPct:0};

test('SEC annual diluted shares retain exact period, unit and filing source',()=>{
  const s=company().evidence.find(x=>x.key==='dilutedShares');
  assert.ok(s,'matching annual diluted shares must be exposed');
  assert.equal(s.value,100_000_000);assert.equal(s.unit,'shares');assert.equal(s.currency,null);
  assert.equal(s.periodStart,'2025-01-01');assert.equal(s.periodEnd,'2025-12-31');
  assert.equal(s.filedAt,'2026-02-15');assert.match(s.sourceUrl,/000000000126000001/);
});
test('SEC shares reject mismatched period, future filing, superseded filing and monetary units',()=>{
  for(const rows of [[annual(200,{start:'2025-10-01'})],[annual(200,{filed:'2027-01-01'})],[annual(200,{accn:'0000000001-26-000002'})],[annual(0)],[annual(-2)]]){
    assert.equal(company(facts(rows)).evidence.find(x=>x.key==='dilutedShares'),undefined);
  }
  assert.equal(company(facts([],{WeightedAverageNumberOfDilutedSharesOutstanding:concept([annual(2)],'USD')})).evidence.find(x=>x.key==='dilutedShares'),undefined);
});
test('SEC share duplicates with conflicting values are unavailable, never arbitrarily selected',()=>{
  assert.equal(company(facts([annual(100),annual(200)])).evidence.find(x=>x.key==='dilutedShares'),undefined);
});
test('flat cash flow with zero terminal growth discounts to the perpetuity value without a debt adjustment',()=>{
  assert.equal(typeof workbench.calculateCashFlowScenario,'function');
  const result=workbench.calculateCashFlowScenario(workbench.extractValuationEvidence(input()),assumptions);
  assert.equal(result.status,'EXPLORATORY');assert.equal(result.decisionGrade,false);
  assert.ok(Math.abs(result.estimatePerShare-20)<1e-10);
  assert.equal(result.projection.length,5);
  assert.ok(Math.abs(result.explicitPresentValuePerShare+result.terminalPresentValuePerShare-20)<1e-10);
  assert.ok(Math.abs(result.differenceFromPricePct-(-100/3))<1e-10);
});
test('editable growth, equity discount rate, dilution and cash deductions change real cash-flow estimates',()=>{
  const evidence=workbench.extractValuationEvidence(input());
  const base=workbench.calculateCashFlowScenario(evidence,assumptions);
  assert.ok(workbench.calculateCashFlowScenario(evidence,{...assumptions,growthPct:8}).estimatePerShare>base.estimatePerShare);
  assert.ok(workbench.calculateCashFlowScenario(evidence,{...assumptions,discountRatePct:12}).estimatePerShare<base.estimatePerShare);
  assert.ok(workbench.calculateCashFlowScenario(evidence,{...assumptions,dilutionPct:3}).estimatePerShare<base.estimatePerShare);
  assert.ok(Math.abs(workbench.calculateCashFlowScenario(evidence,{...assumptions,cashDeductionPct:25}).estimatePerShare-15)<1e-10);
});
test('negative FCF, unsupported sectors, crypto and unknown classification cannot publish a generic DCF',()=>{
  const negative=company(facts(undefined,{NetCashProvidedByUsedInOperatingActivities:concept([annual(50_000_000)])}));
  for(const sample of [input({company:negative}),input({symbol:'NBIS',businessModel:'AI_DATA_CENTER_INFRA'}),input({symbol:'IREN',businessModel:'MINER_COMMODITY'}),input({businessModel:'BANK'}),input({businessModel:'REIT'}),input({businessModel:null}),input({symbol:'BTC/USD',assetType:'CRYPTO'})]){
    const evidence=workbench.extractValuationEvidence(sample);
    const result=workbench.calculateCashFlowScenario(evidence,assumptions);
    assert.equal(result.estimatePerShare,null);assert.equal(result.status,'UNAVAILABLE');assert.ok(evidence.blockingReasons.length);
  }
});
test('MSFT and APP use the same explicit cash-flow arithmetic only with sufficient evidence',()=>{
  for(const [symbol,businessModel] of [['MSFT','SAAS_SOFTWARE'],['APP','MARKETPLACE_ADTECH']]){
    assert.ok(Math.abs(workbench.calculateCashFlowScenario(workbench.extractValuationEvidence(input({symbol,businessModel})),assumptions).estimatePerShare-20)<1e-10);
  }
});
test('missing SEC share evidence cannot silently infer shares from cap/price or undated provider shares',()=>{
  const evidence=workbench.extractValuationEvidence(input({company:company(facts([]))}));
  assert.equal(evidence.shares,null);assert.equal(evidence.providerShares,100_000_000);
  assert.equal(workbench.calculateCashFlowScenario(evidence,assumptions).estimatePerShare,null);
  const reviewed=workbench.extractValuationEvidence(input({company:company(facts([])),reviewedShares:{value:100_000_000,asOf:'2026-10-01'}}));
  assert.ok(Math.abs(workbench.calculateCashFlowScenario(reviewed,assumptions).estimatePerShare-20)<1e-10);
  assert.equal(reviewed.shareBasis,'USER_REVIEWED');
});
test('currency, duration, continuity, as-of and source gates reject invalid cash inputs',()=>{
  for(const mutate of [c=>{c.rawMetrics.fcf=null;},c=>{c.evidence.find(x=>x.key==='capex').currency='EUR';},c=>{c.evidence.find(x=>x.key==='capex').periodStart='2025-10-01';},c=>{c.evidence.find(x=>x.key==='operatingCashFlow').sourceUrl=null;},c=>{c.evidence.find(x=>x.key==='operatingCashFlow').filedAt='2027-01-01';},c=>{c.evidence.find(x=>x.key==='operatingCashFlow').basis='IFRS';}]){
    const c=company();mutate(c);const result=workbench.calculateCashFlowScenario(workbench.extractValuationEvidence(input({company:c})),assumptions);
    assert.equal(result.estimatePerShare,null);
  }
  assert.equal(workbench.calculateCashFlowScenario(workbench.extractValuationEvidence(input({asOf:'2028-10-16'})),assumptions).estimatePerShare,null);
});
test('terminal growth at or above equity discount rate and nonfinite assumptions fail explicitly',()=>{
  const evidence=workbench.extractValuationEvidence(input());
  for(const bad of [{terminalGrowthPct:10},{discountRatePct:0},{growthPct:NaN},{cashDeductionPct:100},{dilutionPct:-100}]){
    const result=workbench.calculateCashFlowScenario(evidence,{...assumptions,...bad});
    assert.equal(result.estimatePerShare,null);assert.ok(result.errors.length);
  }
});
test('missing, future or stale price timestamp and foreign quote currency suppress comparison, not cash estimates',()=>{
  for(const extra of [{priceAsOf:null},{priceAsOf:'2026-10-17T12:00:00Z'},{priceAsOf:'2026-09-01T12:00:00Z'},{profile:{currency:'EUR'}}]){
    const result=workbench.calculateCashFlowScenario(workbench.extractValuationEvidence(input(extra)),assumptions);
    assert.ok(Math.abs(result.estimatePerShare-20)<1e-10);assert.equal(result.differenceFromPricePct,null);
  }
});
test('source-backed FCF yield requires explicit matching quote currency and identifies its denominator',()=>{
  const good=workbench.extractValuationEvidence(input());
  assert.ok(Math.abs(good.fcfYieldPct-(200_000_000/3_000_000_000*100))<1e-10);
  assert.match(good.fcfYieldBasis,/provider market capitalization/i);
  assert.equal(workbench.extractValuationEvidence(input({profile:{marketCapitalization:3000}})).fcfYieldPct,null);
});
test('discontinued operations preserve labeled reported figures but cannot unlock a continuing-business valuation',()=>{
  const c=company(facts(undefined,{IncomeLossFromDiscontinuedOperationsNetOfTax:concept([annual(5_000_000)])}));
  assert.equal(c.rawMetrics.fcf,null);
  assert.equal(c.evidence.find(x=>x.key==='dilutedShares')?.value,100_000_000);
  const evidence=workbench.extractValuationEvidence(input({company:c}));
  assert.equal(evidence.fcf,null);
  assert.equal(evidence.shares,100_000_000);
  assert.equal(evidence.reportedCashFlow?.fcf,200_000_000);
  assert.equal(evidence.reportedCashFlow?.projectionEligible,false);
  assert.match(evidence.blockingReasons.join(' '),/discontinued/i);
  assert.equal(workbench.calculateCashFlowScenario(evidence,assumptions).estimatePerShare,null);
});
