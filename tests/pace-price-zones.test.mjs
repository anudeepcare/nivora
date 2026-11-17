import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pacePriceZones} from '../lib/pace-price-zones.ts';
import {makePacePriceEvaluator} from '../lib/pace-price-evaluator.ts';
import {adaptiveSettledBars} from '../lib/accumulation-policy-v6.ts';
const fixtures=JSON.parse(fs.readFileSync('tests/fixtures/pace-v6-bars.json','utf8'));
test('price bands classify their interiors with the actual stock policy and cache unchanged inputs',async()=>{
 for(const {symbol,bars} of fixtures){
  const asOf='2026-11-06T22:00:00Z';
  const result=await pacePriceZones(bars,asOf,'forming');
  assert.ok(result,symbol);assert.ok(result.ranges.length>=4,symbol);
  const rows=adaptiveSettledBars(bars,asOf,'us-equity').filter(x=>x.time<=result.date);
  const at=makePacePriceEvaluator(rows,result.policy==='monthly-v6');
  for(const band of result.ranges){assert.ok(band.high>band.low);for(const fraction of [.1,.5,.9]) assert.equal(at(band.low+(band.high-band.low)*fraction),band.level,`${symbol} P${band.level}`);}
  assert.ok(result.ranges.some(x=>x.low<=result.reference&&x.high>=result.reference));
  assert.equal(await pacePriceZones(bars,asOf,'forming'),result);
 }
});
test('price-band scans are abortable and insufficient history creates no invented levels',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(pacePriceZones(structuredClone(fixtures[0].bars),'2026-11-06T22:00:00Z','forming','us-equity',controller.signal),{name:'AbortError'});
 assert.equal(await pacePriceZones([],'2026-11-06T22:00:00Z','forming'),null);
});
