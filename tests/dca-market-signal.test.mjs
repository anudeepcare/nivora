import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {buildDcaMarketSignal}=require('../lib/dca-market-signal.ts');
const asOf='2026-01-05T12:00:00Z';
const bars=(last=100)=>Array.from({length:52},(_,i)=>{const close=i===51?last:100;return{time:new Date(Date.UTC(2025,0,6+i*7)).toISOString().slice(0,10),open:close,high:close,low:close,close,volume:100}});
test('DCA distinguishes ordinary, pullback, deep pullback and extended prices without a contribution amount',()=>{
 for(const [price,want] of [[100,1],[80,2],[60,4],[120,0]])assert.equal(buildDcaMarketSignal(bars(price),{asOf}).multiplier,want);
});
test('insufficient, stale and discontinuous histories never invent a DCA multiplier',()=>{
 for(const input of [[],bars().slice(-20),bars().filter((_,i)=>i!==30)])assert.equal(buildDcaMarketSignal(input,{asOf}).multiplier,null);
 assert.equal(buildDcaMarketSignal(bars(),{asOf:'2026-03-01'}).multiplier,null);
});
test('current-week and future bars cannot repaint the confirmed signal or historical values',()=>{
 const before=buildDcaMarketSignal(bars(80),{asOf});
 const after=buildDcaMarketSignal([...bars(80),{time:'2026-01-05',open:1,high:1,low:1,close:1},{time:'2027-01-01',close:999}],{asOf});
 assert.deepEqual(after,before);assert.equal(before.observedAt,'2025-12-29');
});
test('a documented broken thesis overrides a technical accumulation indication',()=>{
 const signal=buildDcaMarketSignal(bars(60),{asOf,thesisBroken:true});assert.equal(signal.multiplier,0);assert.equal(signal.state,'THESIS_REVIEW');
});
