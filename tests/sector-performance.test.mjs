import test from 'node:test';import assert from 'node:assert/strict';import {sectorReturns} from '../lib/sector-performance.ts';
const bars=Array.from({length:70},(_,i)=>({time:new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10),close:100+i,open:0,high:0,low:0,volume:0}));
test('sector comparisons align dates and do not invent returns from insufficient or mismatched history',()=>{
 const result=sectorReturns(bars,bars);assert.equal(result.periods['1M'].relative,0);assert.equal(result.periods['1Y'].change,null);assert.equal(result.periods['3M'].start,bars[6].time);
 const missing=sectorReturns(bars.slice(0,-1),bars);assert.equal(missing.periods['1W'].change,null);
});
