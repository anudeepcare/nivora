import test from 'node:test';import assert from 'node:assert/strict';
import {technicalContext} from '../lib/technical-context.ts';
const bars=Array.from({length:70},(_,i)=>{const c=10+i;return {time:new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),open:c,high:c+1,low:c-1,close:c,volume:100}});
test('additional technicals use observed OHLCV and return known monotonic oscillator values',()=>{const r=technicalContext(bars,'2026-04-01T12:00:00Z','crypto');assert.ok(Math.abs(r.williamsR+100/15)<1e-8);assert.equal(r.mfi,100);assert.equal(r.efficiency,1);assert.ok(Math.abs(r.cci-126.6666666667)<1e-6);assert.equal(r.donchian20.high,79);assert.equal(r.donchian20.low,58);});
test('flat prices, absent volume and short histories remain finite or explicitly unavailable',()=>{const flat=bars.map(b=>({...b,open:10,high:10,low:10,close:10,volume:0}));const r=technicalContext(flat,'2026-04-01T12:00:00Z','crypto');assert.equal(r.cci,0);assert.equal(r.williamsR,null);assert.equal(r.mfi,null);assert.equal(r.efficiency,0);assert.equal(technicalContext(bars.slice(0,5),'2026-04-01T12:00:00Z','crypto').cci,null);assert.equal(r.wma200Week,null);});
test('future bars cannot change technical context',()=>{assert.deepEqual(technicalContext(bars,'2026-03-01T12:00:00Z','crypto'),technicalContext(bars.filter(x=>x.time<'2026-03-01'),'2026-03-01T12:00:00Z','crypto'));});
test('weekly WMAs use completed consecutive weeks with the newest close weighted most',()=>{
 const b=Array.from({length:210},(_,i)=>{const c=100+i;return {time:new Date(Date.UTC(2020,0,5+7*i)).toISOString().slice(0,10),open:c,high:c,low:c,close:c,volume:100}});
 const r=technicalContext(b,'2025-01-01T00:00:00Z','crypto'),expected=b.slice(-200).reduce((s,x,i)=>s+x.close*(i+1),0)/(200*201/2);assert.ok(Math.abs(r.wma200Week-expected)<1e-9);assert.equal(technicalContext(b.filter((_,i)=>i!==100),'2025-01-01T00:00:00Z','crypto').wma200Week,null);
});
