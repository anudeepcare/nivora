import test from 'node:test';
import assert from 'node:assert/strict';
let mod; try{mod=await import('../.engine-test/auryn/v92/integrity.js')}catch{}
const bar=(symbol,date,close)=>({symbol,date,open:close-.5,high:close+1,low:close-1,close,volume:1000,adjusted:true});
const bundle=()=>({meta:{datasetId:'x',version:'1',source:'TEST',benchmarkSymbol:'SPY',adjustedPrices:true,pointInTimeUniverse:true,includesDelisted:true,delistingReturnsHandled:true},securities:[{symbol:'AAA'},{symbol:'OLD',delistedDate:'2023-12-31',delistingReturnPct:-25}],dailyBars:[bar('AAA','2024-01-02',100),bar('AAA','2024-01-03',101),bar('OLD','2023-12-29',10)],benchmarkBars:[bar('SPY','2023-12-29',399),bar('SPY','2024-01-02',400),bar('SPY','2024-01-03',401)],facts:[{symbol:'AAA',metric:'revenue',value:1000,periodEnd:'2023-12-31',availableAt:'2024-02-10'}],events:[],universeSnapshots:[{date:'2023-01-01',symbols:['AAA','OLD']},{date:'2024-01-01',symbols:['AAA']}]});

test('V9.2 integrity audit returns machine-readable coverage and passes valid survivorship-safe bundle',()=>{
 assert.ok(mod,'V9.2 integrity module must exist');
 const r=mod.auditV92ReplayBundle(bundle());
 assert.equal(r.status,'PASS');
 assert.equal(r.hardFailures.length,0);
 assert.equal(r.coverage.symbolsWithBars,2);
 assert.equal(r.coverage.factMetrics.revenue,1);
 assert.equal(r.coverage.years['2024']>0,true);
});

test('V9.2 integrity audit blocks false survivorship claims and duplicate contradictory facts',()=>{
 const b=bundle(); b.universeSnapshots=[];
 b.facts.push({...b.facts[0],value:999});
 const r=mod.auditV92ReplayBundle(b);
 assert.equal(r.status,'BLOCKED');
 assert.ok(r.hardFailures.some(x=>/survivorship|universe/i.test(x)));
 assert.ok(r.hardFailures.some(x=>/contradict|duplicate/i.test(x)));
});

test('V9.2 integrity reports benchmark-session gaps, family coverage and zero corporate-action corruption',()=>{
 const b=bundle();
 b.corporateActions=[{symbol:'AAA',type:'DIVIDEND',date:'2024-01-03',ratio:null,amount:.25,availableAt:'2024-01-03',source:'TEST'}];
 b.adapterCoverage={CORPORATE_ACTIONS:['AAA','OLD'],FUNDAMENTALS:['AAA','OLD'],EARNINGS:['AAA'],REVISION:['AAA'],SECTOR:['AAA','OLD'],MACRO:['__MACRO__']};
 b.events.push({symbol:'AAA',metric:'eps_revision_breadth',value:.2,availableAt:'2024-01-02'});
 b.events.push({symbol:'AAA',metric:'sector_relative_strength',value:1.1,availableAt:'2024-01-02'});
 b.events.push({symbol:'__MACRO__',metric:'fed_funds_rate',value:5.25,availableAt:'2024-01-02'});
 const r=mod.auditV92ReplayBundle(b);
 assert.equal(r.coverage.corporateActions,1);
 assert.equal(r.coverage.corporateActionCorruptionCount,0);
 assert.equal(r.coverage.familyRows.REVISION,1);
 assert.equal(r.coverage.familyRows.SECTOR,1);
 assert.equal(r.coverage.familyRows.MACRO,1);
 assert.ok('sessionGapCount' in r.coverage);
 assert.equal(r.coverage.sessionExpectedCount,3,'expected sessions must respect each security active window');
});

test('V9.2 integrity blocks split-adjustment corruption instead of trusting adjusted=true blindly',()=>{
 const b=bundle();
 b.securities=[{symbol:'AAA'}];
 b.dailyBars=[bar('AAA','2024-06-07',400),bar('AAA','2024-06-10',101)];
 b.benchmarkBars=[bar('SPY','2024-06-07',500),bar('SPY','2024-06-10',501)];
 b.corporateActions=[{symbol:'AAA',type:'SPLIT',date:'2024-06-10',ratio:.25,amount:null,availableAt:'2024-06-10',source:'TEST'}];
 b.meta.pointInTimeUniverse=false;b.meta.includesDelisted=false;b.meta.delistingReturnsHandled=false;b.universeSnapshots=[];
 const r=mod.auditV92ReplayBundle(b);
 assert.equal(r.status,'BLOCKED');
 assert.ok(r.hardFailures.some(x=>/split|corporate action|adjust/i.test(x)));
 assert.ok(r.coverage.corporateActionCorruptionCount>0);
});
