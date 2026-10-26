import test from 'node:test';import assert from 'node:assert/strict';
import {rewindSeries,rewindStats,rewindFor,REWIND_HORIZONS} from '../lib/rewind.ts';import {demoData} from './fixtures/demo.ts';
const bars=(n,f)=>Array.from({length:n},(_,i)=>{const c=f(i);return {time:'t'+i,open:c,high:c+1,low:c-1,close:c,volume:1};});
test('each day carries only what was known that day, with exact reference values',()=>{
 const d=rewindSeries(bars(300,i=>100+i));assert.equal(d.length,300);
 assert.equal(d[48].ma50,null);assert.equal(d[49].ma50,(100+149)/2+0);assert.equal(d[199].ma200,(100+299)/2);
 assert.equal(d[250].trend,'above');assert.equal(d[250].rsi,100);assert.equal(d[250].rsiBand,'high');assert.equal(d[250].drawdown,0);
 assert.equal(d[0].trend,null);assert.equal(d[0].rsiBand,null);
});
test('forward returns look only at later sessions and are null until observed',()=>{
 const d=rewindSeries(bars(300,i=>100+i));
 assert.equal(d[10].forward[21],(131/110-1)*100);assert.equal(d[299].forward[21],null);assert.equal(d[299-21].forward[21],(399/378-1)*100);assert.equal(d[299-20].forward[21],null);
});
test('a fall reads as below with a negative drawdown',()=>{
 const d=rewindSeries(bars(300,i=>500-i));const x=d[299];assert.equal(x.trend,'below');assert.equal(x.rsi,0);assert.equal(x.rsiBand,'low');assert.ok(x.drawdown<0);
});
test('days-like-this compares the same state with all observed days and never uses unobserved outcomes',()=>{
 const d=rewindSeries(bars(400,i=>100+i));const s=rewindStats(d,300,63);
 assert.equal(s.state.trend,'above');assert.ok(s.like.days>0&&s.like.days<=s.all.days);assert.ok(s.like.median>0);assert.equal(s.like.positiveShare,100);
 assert.equal(s.all.days,d.filter(x=>x.forward[63]!=null).length);
 assert.equal(rewindStats(d,0,63),null);assert.equal(rewindStats(d,9999,63),null);
});
test('real fixture history produces finite values and a bounded window',()=>{
 const r=demoData.research.MSFT;const d=rewindFor(r.history,r.retrievedAt);assert.ok(d.length>0&&d.length<=1260);
 assert.ok(!/NaN|Infinity/.test(JSON.stringify(d)));assert.deepEqual([...REWIND_HORIZONS],[21,63,126]);
});
