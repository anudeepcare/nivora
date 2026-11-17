import test from 'node:test';
import assert from 'node:assert/strict';
import {decisionAttention} from '../lib/decision-attention.ts';
const signal=(action,extra={})=>({action,view:{detail:'Measured business evidence',actionLabel:action},reason:'Business assessment',changeCondition:'Next comparable report',...extra});
test('existing decisions are preserved and risk review precedes accumulation',()=>{
 const x=decisionAttention({symbols:['ADD','EXIT','HOLD','ADD'],held:['ADD','EXIT','HOLD'],rows:{ADD:{signal:signal('Add')},EXIT:{signal:signal('Sell')},HOLD:{signal:signal('Hold')}}});
 assert.deepEqual(x.map(r=>r.symbol),['EXIT','ADD','HOLD']);assert.equal(x[0].label,'Exit review');assert.equal(x[1].action,'Add');assert.equal(x[1].changeCondition,'Next comparable report');
});
test('position sizing uses only an explicit valid personal threshold and never invents Sell',()=>{
 const input={symbols:['A'],held:['A'],rows:{A:{signal:signal('Hold')}},allocations:[{symbol:'A',weight:42}]};
 assert.equal(decisionAttention(input)[0].sizeReview,false);
 for(const concentrationLimit of [null,0,101,NaN]) assert.equal(decisionAttention({...input,concentrationLimit})[0].sizeReview,false);
 const x=decisionAttention({...input,concentrationLimit:25})[0];assert.equal(x.sizeReview,true);assert.equal(x.action,'Hold');assert.equal(x.label,'Review position size');assert.match(x.reason,/42.0%.*25%/);
});
test('paused, absent and holding-only evidence cannot produce a new Buy recommendation',()=>{
 for(const row of [{},{signal:signal('Buy',{assessmentPaused:true})},{signal:signal('Add',{contextLabel:'For your holding'})}]) {
 const x=decisionAttention({symbols:['A'],held:[],rows:{A:row}})[0];assert.equal(x.action,'Review');assert.equal(x.assessmentAvailable,false);assert.equal(x.changeCondition,null);
 }
});
test('available assessments are shown ahead of still-loading rows',()=>{
 const x=decisionAttention({symbols:['MISSING','HOLD'],held:[],rows:{HOLD:{signal:signal('Watch')}}});assert.equal(x[0].symbol,'HOLD');
});
test('comparison keeps business action alongside independent size review and excludes bad weights',()=>{
 const input={symbols:['A'],held:['A'],rows:{A:{signal:signal('Add')}},allocations:[{symbol:'A',weight:30}],concentrationLimit:20};
 const row=decisionAttention(input)[0]; assert.equal(row.action,'Add'); assert.equal(row.weight,30); assert.equal(row.thresholdGap,-10); assert.equal(row.businessReason,'Business assessment');
 assert.equal(decisionAttention({...input,allocations:[{symbol:'A',weight:NaN}]} )[0].weight,null);
});
