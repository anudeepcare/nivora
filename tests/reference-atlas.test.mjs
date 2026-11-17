import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceAtlas } from '../lib/reference-atlas.ts';
import { demoData } from './fixtures/demo.ts';
import { researchBrief } from '../lib/research-brief.ts';
const source=demoData.research.MSFT;
test('Atlas exposes six evidence orbits without synthetic scores',()=>{
 const m=referenceAtlas(source);
 assert.deepEqual(m.signals.map(x=>x.label),['Business','Value','Momentum','Catalysts','Ownership','Risk']);
 assert.ok(m.signals.every(x=>x.score===null));
 const b=researchBrief(source);
 assert.equal(m.brief.business.title,b.business.title);
 assert.equal(m.signals[0].value,b.businessNumbers.revenueGrowth);
 assert.equal(m.signals[2].value,b.timing.rsi);
});
test('missing evidence remains unavailable instead of borrowing prototype figures',()=>{
 const empty={...source,history:[],facts:[],filings:[],evidence:undefined,snapshot:undefined,quote:{...source.quote,price:null,asOf:null,stale:true}};
 const m=referenceAtlas(empty);
 assert.equal(m.signals[0].value,null);
 assert.equal(m.signals[2].value,null);
 assert.equal(m.signals[3].value,null);
 assert.equal(m.signals[4].value,null);
 assert.equal(m.pace,null);
 assert.deepEqual(m.cases,[]);
});
test('scenario cases retain model horizon and source values, not a hardcoded five years',()=>{
 const m=referenceAtlas(source), b=researchBrief(source);
 if(b.scenarioEligible && b.scenario){
  assert.equal(m.horizon,b.scenario.years);
  assert.deepEqual(m.cases.map(x=>x.value),[b.scenario.low,b.scenario.base,b.scenario.high]);
 }else assert.deepEqual(m.cases,[]);
});
