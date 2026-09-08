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
