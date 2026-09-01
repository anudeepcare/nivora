import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
import test from 'node:test';import assert from 'node:assert/strict';
const p=require('../.engine-test/provider-resilience.js');

test('provider health exposes request and coalescing metrics',async()=>{
 p.resetProviderResilienceForTests();let calls=0;
 await Promise.all([p.coalesceRequest('same',async()=>{calls++;await new Promise(r=>setTimeout(r,10));return 1},'twelvedata'),p.coalesceRequest('same',async()=>{calls++;return 2},'twelvedata')]);
 p.recordProviderResult('twelvedata',true,120);p.recordProviderResult('twelvedata',false,300);
 const h=p.providerHealthSnapshot('twelvedata');
 assert.equal(calls,1);assert.equal(h.requests,2);assert.equal(h.successes,1);assert.equal(h.failures,1);assert.equal(h.errorRatePct,50);assert.equal(h.coalescedJoins,1);assert.equal(h.averageLatencyMs,210);
});
