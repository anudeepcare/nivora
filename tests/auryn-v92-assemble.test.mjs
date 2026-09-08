import test from 'node:test';
import assert from 'node:assert/strict';
let mod; try{mod=await import('../.engine-test/auryn/v92/assemble.js')}catch{}
const bar=(symbol,date,close)=>({symbol,date,open:close-.5,high:close+1,low:close-1,close,volume:1000,adjusted:true});

test('V9.2 assembles deterministic V9.1 replay bundles without inventing survivorship claims',()=>{
 assert.ok(mod,'V9.2 assembler must exist');
 const input={datasetId:'backfill-1',version:'1',source:'TWELVE_DATA+SEC',benchmarkSymbol:'SPY',generatedAt:'2026-09-08T12:00:00Z',securities:[{symbol:'AAA',sector:'Technology'}],dailyBars:[bar('AAA','2024-01-02',100),bar('AAA','2024-01-03',101)],benchmarkBars:[bar('SPY','2024-01-02',400),bar('SPY','2024-01-03',401)],facts:[{symbol:'AAA',metric:'revenue',value:1000,periodEnd:'2023-12-31',availableAt:'2024-02-10'}]};
 const a=mod.assembleHistoricalReplayBundle(input),b=mod.assembleHistoricalReplayBundle(structuredClone(input));
 assert.deepEqual(a,b);
 assert.equal(a.meta.adjustedPrices,true);
 assert.equal(a.meta.pointInTimeUniverse,false);
 assert.equal(a.meta.includesDelisted,false);
 assert.equal(a.meta.delistingReturnsHandled,false);
 assert.deepEqual(a.universeSnapshots,[]);
});

test('V9.2 only marks survivorship safety inputs true when explicit dated universe and delisting policy are supplied',()=>{
 const input={datasetId:'x',source:'TEST',benchmarkSymbol:'SPY',securities:[{symbol:'AAA'},{symbol:'OLD',activeTo:'2023-12-31',delistedDate:'2023-12-31',delistingReturnPct:-40}],dailyBars:[bar('AAA','2024-01-02',100)],benchmarkBars:[bar('SPY','2024-01-02',400)],universeSnapshots:[{date:'2023-01-01',symbols:['AAA','OLD']}],pointInTimeUniverse:true,includesDelisted:true,delistingReturnsHandled:true};
 const r=mod.assembleHistoricalReplayBundle(input);
 assert.equal(r.meta.pointInTimeUniverse,true);assert.equal(r.meta.includesDelisted,true);assert.equal(r.meta.delistingReturnsHandled,true);
});

test('V9.2 preserves corporate-action evidence and adapter coverage in the replay bundle',()=>{
 const input={datasetId:'ca',source:'TEST',benchmarkSymbol:'SPY',securities:[{symbol:'AAA'}],dailyBars:[bar('AAA','2024-01-02',100)],benchmarkBars:[bar('SPY','2024-01-02',400)],corporateActions:[{symbol:'AAA',type:'DIVIDEND',date:'2024-01-02',ratio:null,amount:.25,availableAt:'2024-01-02',source:'TEST'}],adapterCoverage:{CORPORATE_ACTIONS:['AAA'],EARNINGS:['AAA'],FUNDAMENTALS:['AAA'],REVISION:['AAA'],SECTOR:['AAA'],MACRO:['__MACRO__']}};
 const r=mod.assembleHistoricalReplayBundle(input);
 assert.equal(r.corporateActions.length,1);
 assert.deepEqual(r.adapterCoverage.CORPORATE_ACTIONS,['AAA']);
});
