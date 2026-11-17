import test from 'node:test';import assert from 'node:assert/strict';
import {demoData} from './fixtures/demo.ts';
test('value desk reports supplied ratios and refuses earnings yields for nonpositive earnings',async()=>{
 const {valueDesk}=await import('../lib/research-desks.ts');const r=structuredClone(demoData.research.MSFT);r.evidence={...(r.evidence||{}),updatedAt:'2026-10-21',multiples:{TrailingPE:25,ForwardPE:20,EnterpriseValueRevenue:8,PriceBookMRQ:6},highlights:{DividendYield:.01}};
 const x=valueDesk(r);assert.equal(x.metrics.find(m=>m.key==='earningsYield').value,4);assert.equal(x.metrics.find(m=>m.key==='forwardYield').value,5);assert.equal(x.metrics.find(m=>m.key==='dividendYield').value,1);
 r.evidence.multiples.TrailingPE=-5;assert.equal(valueDesk(r).metrics.find(m=>m.key==='earningsYield').value,null);
 r.company.assetType='crypto';assert.deepEqual(valueDesk(r).metrics,[]);
});
test('advanced desk excludes uncompleted observations, preserves histogram mass and computes signed drawdown',async()=>{
 const {advancedDesk}=await import('../lib/research-desks.ts');const r=structuredClone(demoData.research.MSFT);
 r.retrievedAt='2026-10-22T23:00:00Z';r.history=Array.from({length:80},(_,i)=>{const close=100-i*.5;return {time:new Date(Date.UTC(2026,6,1+i)).toISOString().slice(0,10),open:close,high:close+1,low:close-1,close,volume:10000}});
 const x=advancedDesk(r);assert.equal(x.distribution.reduce((s,b)=>s+b.count,0),79);assert.equal(x.drawdown.at(-1).value,-39.5);assert.equal(x.metrics.find(m=>m.key==='recovery').value,100/60.5*100-100);
 const old=JSON.stringify(x);r.history.push({time:'2026-10-23',open:999,high:1000,low:998,close:999,volume:999});assert.equal(JSON.stringify(advancedDesk(r)),old);
});
