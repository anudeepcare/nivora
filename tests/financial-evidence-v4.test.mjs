import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const module={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/sec-company-evidence.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {buildSecCompanyEvidence}=module.exports;
const row=(value,start,end,extra={})=>({val:value,start,end,filed:'2026-02-15',accn:'0000000001-26-000001',form:'10-K',...extra});
const concept=(rows,unit='USD')=>({units:{[unit]:rows}});
const build=(facts,extra={},asOf='2026-10-16')=>buildSecCompanyEvidence({facts:{'us-gaap':facts,...extra}},{cik:'1',asOf});
const annual=(value,year=2025,extra={})=>row(value,`${year}-01-01`,`${year}-12-31`,extra);

test('equal-identity conflicting money facts are unavailable independent of input order',()=>{
  for(const values of [[100,200],[200,100]]){
    const result=build({Revenues:concept(values.map(v=>annual(v)))});
    assert.equal(result.rawMetrics.revenue,null);
    assert.ok(result.financials.issues.some(i=>i.code==='CONFLICT'&&i.metric==='revenue'));
  }
});

test('cumulative cash flows derive standalone quarters and TTM without annualizing YTD',()=>{
  const samples=[annual(100,2024,{filed:'2025-02-15',accn:'0000000001-25-000001'}),annual(140),row(20,'2025-01-01','2025-03-31',{form:'10-Q',filed:'2025-05-01',accn:'0000000001-25-000002'}),row(60,'2025-01-01','2025-06-30',{form:'10-Q',filed:'2025-08-01',accn:'0000000001-25-000003'}),row(90,'2025-01-01','2025-09-30',{form:'10-Q',filed:'2025-11-01',accn:'0000000001-25-000004'}),row(90,'2026-01-01','2026-06-30',{form:'10-Q',filed:'2026-08-01',accn:'0000000001-26-000003'})];
  const result=build({NetCashProvidedByUsedInOperatingActivities:concept(samples)});
  const facts=result.financials?.facts??[];
  assert.equal(facts.find(f=>f.metric==='operatingCashFlow'&&f.scope==='QUARTER'&&f.periodEnd==='2025-06-30')?.value,40);
  assert.equal(facts.find(f=>f.metric==='operatingCashFlow'&&f.scope==='QUARTER'&&f.periodEnd==='2025-12-31')?.value,50);
  const ttm=facts.find(f=>f.metric==='operatingCashFlow'&&f.scope==='TTM'&&f.periodEnd==='2026-06-30');
  assert.equal(ttm?.value,170);
  assert.equal(ttm.periodStart,'2025-07-01');
  assert.equal(ttm.periodEnd,'2026-06-30');
  assert.equal(ttm.kind,'DERIVED');
  assert.equal(ttm.inputIds.length,3);
  assert.equal(ttm.sourceUrls.length,3);
  assert.equal(result.latestQuarter,null);
});

test('TTM refuses mixed currency and future inputs, and honors non-calendar fiscal years',()=>{
  const a=row(100,'2024-07-01','2025-06-30',{filed:'2025-08-01'});
  const prior=row(30,'2024-07-01','2024-12-31',{form:'10-Q',filed:'2025-02-01'});
  const latest=row(45,'2025-07-01','2025-12-31',{form:'10-Q',filed:'2026-02-15'});
  assert.equal(build({Revenues:concept([a,prior,latest])}).financials?.facts.find(f=>f.scope==='TTM')?.value,115);
  assert.equal(build({Revenues:{units:{USD:[a,prior],EUR:[latest]}}}).financials?.facts.filter(f=>f.scope==='TTM').length,0);
  assert.equal(build({Revenues:concept([a,prior,latest])},{},'2026-01-01').financials?.facts.filter(f=>f.scope==='TTM').length,0);
});

test('current outstanding shares and annual diluted averages retain distinct evidence',()=>{
  const result=build({Revenues:concept([annual(100)]),NetCashProvidedByUsedInOperatingActivities:concept([annual(30)]),WeightedAverageNumberOfDilutedSharesOutstanding:concept([annual(20)],'shares'),LongTermDebtCurrent:concept([{...annual(5),start:undefined}]),LongTermDebtNoncurrent:concept([{...annual(10),start:undefined}])},{dei:{EntityCommonStockSharesOutstanding:concept([{val:25,end:'2026-01-31',filed:'2026-02-15',accn:'0000000001-26-000001',form:'10-K'}],'shares')}});
  assert.equal(result.evidence.find(f=>f.key==='dilutedShares')?.value,20);
  const shares=result.financials?.facts.find(f=>f.metric==='sharesOutstanding');
  assert.equal(shares?.value,25);
  assert.equal(shares.scope,'POINT_IN_TIME');
  assert.equal(shares.currency,null);
  assert.equal(shares.unit,'shares');
  assert.equal(result.financials.facts.find(f=>f.metric==='currentDebt')?.value,5);
  assert.equal(result.financials.facts.find(f=>f.metric==='noncurrentDebt')?.value,10);
});

test('monetary conflicts cannot silently fall back to a superseded annual value',()=>{
  const result=build({Revenues:concept([annual(80),annual(100,2025,{filed:'2026-04-01',accn:'0000000001-26-000002'}),annual(120,2025,{filed:'2026-04-01',accn:'0000000001-26-000002'})])});
  assert.equal(result.rawMetrics.revenue,null);
});

test('four contiguous standalone quarters produce TTM while gaps cannot',()=>{
  const samples=[row(10,'2025-07-01','2025-09-30'),row(20,'2025-10-01','2025-12-31'),row(30,'2026-01-01','2026-03-31',{filed:'2026-05-01'}),row(40,'2026-04-01','2026-06-30',{filed:'2026-08-01'})];
  const ttm=build({Revenues:concept(samples)}).financials.facts.find(f=>f.scope==='TTM');
  assert.equal(ttm?.value,100);assert.equal(ttm.calculation,'SUM_FOUR_CONTIGUOUS_QUARTERS');
  assert.equal(build({Revenues:concept(samples.filter((_,i)=>i!==1))}).financials.facts.filter(f=>f.scope==='TTM').length,0);
});

test('unresolved share conflicts do not publish an alternate current share count',()=>{
  const c=build({CommonStockSharesOutstanding:concept([{...annual(20),start:undefined}],'shares')},{dei:{EntityCommonStockSharesOutstanding:concept([{...annual(25),start:undefined},{...annual(30),start:undefined}],'shares')}});
  assert.equal(c.financials.facts.filter(f=>f.metric==='sharesOutstanding').length,0);
});

test('later unambiguous same-basis amendment supersedes a historical conflict without erasing its audit',()=>{
 const amend={filed:'2026-03-01',accn:'0000000001-26-000002',form:'10-K/A'};
 const facts={Revenues:concept([annual(100),annual(120,2025,amend)]),RevenueFromContractWithCustomerExcludingAssessedTax:concept([annual(110),annual(120,2025,amend)])};
 const result=build(facts);assert.equal(result.rawMetrics.revenue,120);const issue=result.financials.issues.find(i=>i.metric==='revenue');assert.equal(issue.status,'SUPERSEDED');assert.equal(issue.resolvedAt,'2026-03-01');
 const before=build(facts,{},'2026-02-20');assert.equal(before.rawMetrics.revenue,null);assert.equal(before.financials.issues[0].status,'UNRESOLVED');
});
