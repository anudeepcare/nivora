import test from 'node:test';import assert from 'node:assert/strict';
import {latestFinancialEvidence,indicators} from '../lib/analysis.ts';import {accumulation} from '../lib/engine.ts';import {priceStudies} from '../lib/price-studies.ts';import {demoData} from './fixtures/demo.ts';
test('quote-only changes reuse completed financial and price studies without reusing stale inputs',()=>{
 const r=demoData.research.MSFT,next={...r,quote:{...r.quote,price:r.quote.price+1}};
 assert.strictEqual(latestFinancialEvidence(r),latestFinancialEvidence(next));
 assert.strictEqual(indicators(r.history,r.retrievedAt),indicators(next.history,next.retrievedAt));
 assert.strictEqual(accumulation(r.history,r.retrievedAt),accumulation(next.history,next.retrievedAt));
 assert.strictEqual(priceStudies(r.history,r.retrievedAt),priceStudies(next.history,next.retrievedAt));
 assert.notStrictEqual(indicators(r.history,r.retrievedAt),indicators([...r.history],r.retrievedAt));
 assert.notStrictEqual(latestFinancialEvidence(r),latestFinancialEvidence({...r,facts:[...r.facts]}));
 assert.notStrictEqual(indicators(r.history,r.retrievedAt),indicators(r.history,'2026-09-01T00:00:00Z'));
});
test('first research-tab visits reveal their content below the sticky navigation without restoring a deep old offset',async()=>{
 const {researchTabTarget}=await import('../lib/research-interaction.ts');
 assert.equal(researchTabTarget(undefined,4800,320,120),200);
 assert.equal(researchTabTarget(undefined,0,320,120),0);
 assert.equal(researchTabTarget(850,4800,320,120),850);
 assert.equal(researchTabTarget(undefined,NaN,NaN,120),0);
});
