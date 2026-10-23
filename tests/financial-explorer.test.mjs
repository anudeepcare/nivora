import test from 'node:test';import assert from 'node:assert/strict';
import {financialMetricSeries} from '../lib/financial-explorer.ts';
import {demoData} from './fixtures/demo.ts';
test('financial chart series keeps comparable dated reported observations and truthful statistics',()=>{const s=financialMetricSeries(demoData.research.MSFT,'annual','revenue',5);assert.ok(s.points.length>=3);assert.equal(new Set(s.points.map(x=>x.end)).size,s.points.length);assert.ok(s.latest>0);assert.ok(s.cagr>0);assert.equal(s.unit,'money');assert.equal(s.currency,'USD');});
test('percentage charts use percentage-point changes and do not imply annualized returns',()=>{const s=financialMetricSeries(demoData.research.MSFT,'annual','margin',5);assert.equal(s.cagr,null);assert.equal(s.changeUnit,'pp');assert.ok(Number.isFinite(s.change));});
test('missing and inapplicable financial fields do not become zero charts',()=>{const s=financialMetricSeries({...demoData.research.MSFT,facts:[]},'annual','revenue',5);assert.equal(s.latest,null);assert.equal(s.points.length,0);assert.equal(s.cagr,null);const bank={...demoData.research.MSFT,company:{...demoData.research.MSFT.company,symbol:'NU',sector:'Financial Services'},evidence:{profile:{sector:'Financial Services',industry:'Banks'}}};assert.equal(financialMetricSeries(bank,'annual','fcf',5).definition,null);});
test('reported financial charts survive missing or changed live quotes',()=>{
 const r=demoData.research.MSFT,s=financialMetricSeries(r,'annual','revenue',5);
 assert.deepEqual(financialMetricSeries({...r,quote:{...r.quote,price:null,stale:true}},'annual','revenue',5),s);
});
