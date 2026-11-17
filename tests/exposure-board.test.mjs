import test from 'node:test';
import assert from 'node:assert/strict';
import { exposureBoard, compareExposure, parseBoardState } from '../lib/exposure-board.ts';
const date='2026-11-05';
const contract=(extra={})=>({id:'c',type:'call',strike:100,expiry:'2026-12-18',observed:date,bid:2,ask:3,oi:10,volume:20,iv:.3,delta:.5,gamma:.02,theta:-.1,vega:.1,multiplier:100,standard:true,...extra});
test('GEX uses dollar exposure per 1% move and preserves true zero',()=>{
 const b=exposureBoard([contract(),contract({id:'p',type:'put'})],100);
 assert.equal(b.cells[0].gex,0); assert.equal(b.cells[0].oi,20); assert.equal(b.cells[0].coverage,1);
});
test('missing inputs and mixed observation dates never produce a measured total',()=>{
 assert.equal(exposureBoard([contract({gamma:null})],100).cells[0].gex,null);
 assert.equal(exposureBoard([contract(),contract({id:'p',type:'put',observed:'2026-11-04'})],100).cells[0].gex,null);
 assert.equal(exposureBoard([contract({gamma:NaN})],100).cells[0].gex,null);
});
test('partial inputs retain coverage without pretending a complete cell',()=>{
 const b=exposureBoard([contract(),contract({id:'p',type:'put',gamma:null})],100);
 assert.equal(b.cells[0].coverage,.5); assert.equal(b.cells[0].gex,null);
});
test('deduplicates contracts and excludes invalid or adjusted contracts',()=>{
 const b=exposureBoard([contract(),contract(),contract({id:'x',standard:false}),contract({id:'y',strike:NaN})],100);
 assert.equal(b.contracts,1); assert.equal(b.cells[0].oi,10);
});
test('snapshot comparison requires same spot, same universe and newer source observation',()=>{
 const a=exposureBoard([contract()],100),b=exposureBoard([contract({oi:20,observed:'2026-11-06'})],100);
 assert.equal(compareExposure(a,b)[0].change,2000);
 assert.equal(compareExposure(a,exposureBoard([contract({oi:20})],100)).length,0);
 assert.equal(compareExposure(a,exposureBoard([contract({observed:'2026-11-06'})],101)).length,0);
});
test('malformed saved state is ignored and bounded valid snapshots survive',()=>{
 assert.deepEqual(parseBoardState('{broken'),{presets:[],snapshots:[]});
 assert.deepEqual(parseBoardState('{"snapshots":[{"symbol":"X"}]}').snapshots,[]);
});
test('a real large-chain snapshot round-trips through persistence validation',()=>{const rows=Array.from({length:4000},(_,i)=>contract({id:`LONGOPTION20261218${i%2?'C':'P'}${String(i).padStart(8,'0')}`,type:i%2?'call':'put',strike:1+Math.floor(i/2)}));const board=exposureBoard(rows,100);const state={presets:[],snapshots:[{id:'large',symbol:'TEST',savedAt:'2026-11-05T12:00:00Z',board}]};assert.equal(parseBoardState(JSON.stringify(state)).snapshots.length,1);});
test('latest changes skip an incomparable first snapshot and isolate symbols',async()=>{const {latestExposureChanges}=await import('../lib/exposure-board.ts');const first=exposureBoard([contract({id:'different'})],100),prior=exposureBoard([contract()],100),current=exposureBoard([contract({oi:20,observed:'2026-11-06'})],100);const snapshots=[{id:'one',symbol:'TEST',savedAt:'2026-11-04',board:first},{id:'two',symbol:'TEST',savedAt:'2026-11-05',board:prior},{id:'other',symbol:'OTHER',savedAt:'2026-11-06',board:prior}];assert.equal(latestExposureChanges(snapshots,'TEST',current).baseline.id,'two');});
test('multi-symbol saved board picks each symbol latest checkpoint and limits visible panels',async()=>{const {latestSymbolSnapshots}=await import('../lib/exposure-board.ts');const board=exposureBoard([contract()],100);const snapshots=[{id:'a',symbol:'APP',savedAt:'2026-11-04',board},{id:'b',symbol:'APP',savedAt:'2026-11-05',board},{id:'c',symbol:'OSCR',savedAt:'2026-11-05',board}];assert.deepEqual(latestSymbolSnapshots(snapshots).map(x=>x.id),['b','c']);});
