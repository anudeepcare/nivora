import test from 'node:test';
import assert from 'node:assert/strict';
import {monthEndSession} from '../lib/calendar.ts';
import {trendAccumulationReading} from '../lib/accumulation-policy-v3.ts';
const m=await import('../lib/accumulation-policy-v4.ts').catch(()=>({}));
const make=(price=100,n=38)=>Array.from({length:n},(_,i)=>{const month=new Date(Date.UTC(2022,i,1)).toISOString().slice(0,7),close=i===n-1?price:100;return {time:monthEndSession(month),open:close,high:close,low:close,close,volume:100};});

test('cycle model uses the prior year anchor and spread gates for increasing contribution zones',()=>{
 assert.equal(typeof m.researchAccumulation,'function');
 for(const [price,expected] of [[100,1],[85,2],[70,3],[50,4],[140,0]]){
  const r=m.researchAccumulation(make(price),'2025-03-03T22:00:00Z');
  assert.equal(r.version,'monthly-v4');assert.equal(r.confirmed.multiplier,expected);assert.equal(r.confirmed.trend,100);assert.equal(r.confirmed.date,'2025-02-28');
 }
});

test('cycle anchor avoids a cheap label solely because a fitted growth trend extrapolates above the current price',()=>{
 assert.equal(typeof m.cycleAccumulationReading,'function');
 const previous=Array.from({length:24},(_,i)=>({...make()[i],close:i<12?20:50+(i-12)*10}));
 const bar={...make().at(-1),close:110};
 const baseline=trendAccumulationReading(previous,bar);
 const r=m.cycleAccumulationReading(previous,bar,baseline);
 assert.equal(r.multiplier,1);assert.equal(r.trend,105);assert.ok(r.deviation>0);
});

test('v4 keeps settlement, future exclusion, completed-month gaps and scale invariance',()=>{
 assert.equal(typeof m.researchAccumulation,'function');
 const bars=make(50),asOf='2025-03-03T22:00:00Z',r=m.researchAccumulation(bars,asOf);
 assert.deepEqual(m.researchAccumulation([...bars,{time:'2030-01-31',open:1,high:1,low:1,close:1,volume:1}],asOf),r);
 const scaled=bars.map(b=>({...b,open:b.open*10,high:b.high*10,low:b.low*10,close:b.close*10}));
 const s=m.researchAccumulation(scaled,asOf);assert.equal(s.confirmed.multiplier,r.confirmed.multiplier);assert.ok(Math.abs(s.confirmed.z-r.confirmed.z)<1e-8);
 assert.equal(m.researchAccumulation(bars.filter(b=>!b.time.startsWith('2024-08')),asOf).confirmed,null);
 assert.equal(m.researchAccumulation(bars.slice(0,10),asOf).confirmed,null);
 const before=m.researchAccumulation(bars,'2025-02-28T20:00:00Z');assert.equal(before.confirmed.month,'2025-01');
});

test('extension reviews distinguish light and strong without inventing a sale amount or future return',()=>{
 assert.equal(typeof m.researchAccumulation,'function');
 const light=m.researchAccumulation(make(140),'2025-03-03T22:00:00Z').confirmed;
 const strong=m.researchAccumulation(make(200),'2025-03-03T22:00:00Z').confirmed;
 assert.equal(light.trimTier,'light');assert.equal(strong.trimTier,'strong');assert.equal(light.multiplier,0);assert.equal(strong.multiplier,0);
 assert.equal('saleAmount' in strong,false);assert.equal('predictedReturn' in strong,false);
});
