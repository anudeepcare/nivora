import test from 'node:test';import assert from 'node:assert/strict';
import {computeMoreStudies,moreStudies} from '../lib/technical-more.ts';import {demoData} from './fixtures/demo.ts';
const bars=(n,f)=>Array.from({length:n},(_,i)=>{const c=f(i);return {time:'t'+i,open:c,high:c+1,low:c-1,close:c,volume:1000};});
const up=computeMoreStudies(bars(300,i=>100+i)),down=computeMoreStudies(bars(300,i=>500-i)),flat=computeMoreStudies(bars(300,()=>100));
test('a steady rise reads as up on every trend system with exact reference values',()=>{
 assert.equal(up.supertrend.direction,'up');assert.equal(up.parabolicSar.direction,'up');assert.ok(up.parabolicSar.level<399);
 assert.equal(up.ichimoku.position,'above');assert.equal(up.ichimoku.tenkan,395);assert.equal(up.ichimoku.kijun,386.5);
 assert.equal(up.aroon.up,100);assert.equal(up.aroon.down,0);assert.equal(up.keltner.position,'above');assert.equal(down.keltner.position,'below');
 assert.equal(up.awesome,14.5);assert.ok(up.trix>0);
});
test('a steady fall mirrors it',()=>{
 assert.equal(down.supertrend.direction,'down');assert.equal(down.parabolicSar.direction,'down');assert.equal(down.ichimoku.position,'below');
 assert.equal(down.aroon.up,0);assert.equal(down.aroon.down,100);assert.equal(down.awesome,-14.5);assert.ok(down.trix<0);
});
test('risk-adjusted studies are honest about missing downside and drawdown',()=>{
 assert.equal(up.risk.returnPerDownside,null);assert.equal(up.risk.ulcerIndex,0);assert.ok(up.risk.annualReturn>0);
 assert.ok(down.risk.annualReturn<0);assert.ok(down.risk.ulcerIndex>10);assert.ok(down.risk.returnPerDownside<0);
 assert.equal(flat.risk.returnPerVolatility,null);assert.equal(flat.risk.volatility,0);
});
test('short or flat history returns null instead of zero or NaN',()=>{
 const s=computeMoreStudies(bars(20,i=>100+i));
 for(const k of ['ichimoku','aroon','keltner','awesome','trix','ultimate','risk','volatility'])assert.equal(s[k],null,k);
 assert.equal(computeMoreStudies([]).supertrend,null);
 const json=JSON.stringify(flat);assert.ok(!/NaN|Infinity/.test(json));
 assert.ok(flat.ultimate===null||Number.isFinite(flat.ultimate));
});
test('volatility percentile ranks the latest 20-day volatility within the past year',()=>{
 const calm=bars(320,i=>100+(i%2?0.2:-0.2));for(let i=300;i<320;i++){calm[i].close=100+(i%2?6:-6);calm[i].high=calm[i].close+1;calm[i].low=calm[i].close-1;}
 const v=computeMoreStudies(calm).volatility;assert.ok(v.percentile>95);assert.ok(v.current>0);
});
test('real fixture history produces finite studies through the settled-bar path',()=>{
 const r=demoData.research.MSFT;const m=moreStudies(r.history,r.retrievedAt);assert.ok(m.count>0);assert.ok(!/NaN|Infinity/.test(JSON.stringify(m)));
});
test('ultimate oscillator reaches its bounds when closes finish at the high or the low of each bar',()=>{
 const mk=(n,f,h,l)=>Array.from({length:n},(_,i)=>{const c=f(i);return {time:'t'+i,open:c,high:c+h,low:c-l,close:c,volume:1};});
 assert.equal(computeMoreStudies(mk(60,i=>100+i,0,2)).ultimate,100);
 assert.equal(computeMoreStudies(mk(60,i=>200-i,2,0)).ultimate,0);
 assert.equal(computeMoreStudies(mk(60,i=>100+i,1,1)).ultimate,50);
});
