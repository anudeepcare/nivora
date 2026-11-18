import test from 'node:test';
import assert from 'node:assert/strict';
import { selectedScenarioProjection } from '../lib/scenario-projection.ts';
import { researchOutlook } from '../lib/outlook.ts';
import { scenarioResearchInput } from '../lib/scenario-reference.ts';
import { demoData } from './fixtures/demo.ts';
test('ordinary model wins, guarded valuation stays guarded, missing model tries only explicit conditional basis',()=>{
 const calls=[];const model={available:true};const missing={available:false,reason:'EPS denominator unavailable'};
 const calculate=(_,opts)=>{calls.push(opts);return opts.priceAnchored?model:missing};
 assert.equal(selectedScenarioProjection({},false,undefined,calculate),model);
 assert.deepEqual(calls,[{fiscalEnd:undefined},{fiscalEnd:undefined,priceAnchored:true}]);
 calls.length=0;assert.equal(selectedScenarioProjection({},true,undefined,calculate),missing);assert.equal(calls.length,1);
 calls.length=0;assert.equal(selectedScenarioProjection({},false,undefined,()=>model),model);
});
test('real per-company default fallback uses identical normalized model and keeps exact unavailable reason',()=>{
 for(const r of Object.values(demoData.research)){
  const input=scenarioResearchInput(r),ordinary=researchOutlook(input);
  const expected=ordinary.available?ordinary:researchOutlook(input,{priceAnchored:true});
  assert.deepEqual(selectedScenarioProjection(input,false),expected);
 }
 const r={...demoData.research.MSFT,evidence:undefined,history:[],facts:[],quote:{price:null,currency:'USD',asOf:null,stale:true}};
 const result=selectedScenarioProjection(r,false);
 assert.equal(result.available,false);assert.ok(result.reason.length>0);
});
function forecastInput(symbol='CRM') { return {
 company:{symbol,assetType:'stock',currency:'USD'},facts:[],history:[],
 quote:{price:100,currency:'USD',stale:false,asOf:'2026-10-16T20:00:00Z'},retrievedAt:'2026-10-17T12:00:00Z',
 evidence:{updatedAt:'2026-10-16',reportingCurrency:'USD',profile:{sector:'Technology',industry:'Software'},multiples:{ForwardPE:20},estimates:[
 {date:'2029-10-17',period:'FY2029',frequency:'annual',currency:'USD',eps:8,epsLow:6,epsHigh:10,analysts:15},
 {date:'2026-12-31',period:'FY2027',frequency:'annual',currency:'USD',eps:5,epsLow:4,epsHigh:6,analysts:12}
 ]}
}; }
test('actual qualified and price-anchored projections retain their distinct method and horizon',()=>{
 const input=forecastInput();const ordinary=researchOutlook(input);
 assert.equal(ordinary.available,true);
 assert.deepEqual(selectedScenarioProjection(input,false),ordinary);
 input.evidence.multiples={};
 assert.equal(researchOutlook(input).available,false);
 const fallback=selectedScenarioProjection(input,false);
 assert.equal(fallback.available,true);assert.equal(fallback.multipleSource,'price-implied');
 assert.deepEqual(fallback,researchOutlook(input,{priceAnchored:true}));
 assert.equal(fallback.end,'2029-10-17');
});
test('Atlas exposes the same real conditional cases, without treating them as independent Value evidence',async()=>{
 const {referenceAtlas}=await import('../lib/reference-atlas.ts');
 const f=forecastInput();f.evidence.multiples={};
 const r={...demoData.research.MSFT,...f,company:{...demoData.research.MSFT.company,...f.company},quote:{...demoData.research.MSFT.quote,...f.quote},snapshot:undefined,filings:[]};
 const a=referenceAtlas(r),p=selectedScenarioProjection(scenarioResearchInput(r),false);
 assert.equal(p.available,true);assert.equal(p.multipleSource,'price-implied');
 assert.deepEqual(a.cases.map(x=>x.value),p.cases.map(x=>x.target));
 assert.equal(a.horizon,p.years);assert.equal(a.outcome.end,p.end);
 assert.match(a.outcome.method,/Price-anchored/);
 assert.equal(a.signals.find(x=>x.label==='Value').value,null);
});
