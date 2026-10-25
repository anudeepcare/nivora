import test from 'node:test';
import assert from 'node:assert/strict';
import {edgeReading} from '../lib/auryn-edge.ts';
const input={business:'strong',value:'supported',timing:'favorable',severeRisk:false,conflicting:false,freshQuote:true,confirmedPace:2,formingPace:4,assetType:'stock'};
test('business warnings do not rewrite completed price Pace',()=>{
 for(const warning of [{severeRisk:true},{conflicting:true}]){
 const r=edgeReading({...input,...warning});assert.equal(r.pace,2);assert.equal(r.formingPace,4);assert.equal(r.riskReview,true);
 }
});
test('invalid developing Pace is unavailable rather than an advertised multiplier',()=>{
 for(const v of [NaN,Infinity,-1,5,2.5])assert.equal(edgeReading({...input,formingPace:v}).formingPace,null);
});
test('owners retain a hold review when valuation alone is incomplete',()=>{
 const r=edgeReading({...input,value:'unestablished',ownsPosition:true});assert.equal(r.verdict,'Hold & monitor');assert.equal(r.assessment,'Hold and monitor');
});
test('readable entry assessment is distinct from trade execution',()=>{
 assert.equal(edgeReading(input).assessment,'Consider starting');assert.equal(edgeReading({...input,ownsPosition:true}).assessment,'Consider adding gradually');
 assert.equal(edgeReading({...input,timing:'mixed'}).assessment,'Start small');
 assert.equal(edgeReading({...input,severeRisk:true}).assessment,'Review exposure before adding');
 assert.equal(edgeReading({...input,value:'unestablished'}).assessment,'Check the price assumptions');
});
