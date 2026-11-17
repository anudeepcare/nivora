import test from 'node:test';import assert from 'node:assert/strict';
import {resolveAccess,defaultAccessConfig,cleanAccessConfig} from '../lib/access-policy.ts';
const input={enabled:true,owner:false,licensed:false,now:'2026-10-23T12:00:00Z'};
test('every new account enters Free without an invitation, including legacy private configurations',()=>{
 for(const config of [{},{mode:'private'},{mode:'beta'}]){const a=resolveAccess({...input,config});assert.equal(a.admitted,true);assert.equal(a.plan,'free');assert.equal(a.sampleOnly,true);assert.equal(a.owner,false);}
 assert.equal(defaultAccessConfig.freeResearch,100);
});
test('Pro research is truly unlimited and expired paid access falls back to admitted Free',()=>{
 for(const extra of [{subscription:{status:'active',paidUntil:'2026-11-01'}},{grant:{expiresAt:'2026-11-01'}}]){const a=resolveAccess({...input,...extra});assert.equal(a.plan,'pro');assert.equal(a.limits.research,-1);}
 const expired=resolveAccess({...input,subscription:{status:'active',paidUntil:'2026-10-01'}});assert.equal(expired.plan,'free');assert.equal(expired.admitted,true);assert.equal(expired.limits.research,100);
 assert.equal(cleanAccessConfig({proResearch:100}).proResearch,-1);assert.throws(()=>cleanAccessConfig({freeResearch:-1}));
});
test('a paid subscription takes billing precedence over a complimentary grant without erasing its remaining access',()=>{
 const grant={expiresAt:'2026-12-01'};
 const paid=resolveAccess({...input,grant,subscription:{status:'active',paidUntil:'2026-11-01'}});assert.equal(paid.source,'subscription');assert.equal(paid.limits.research,-1);
 const canceled=resolveAccess({...input,grant,subscription:{status:'canceled',paidUntil:'2026-10-01'}});assert.equal(canceled.source,'complimentary');assert.equal(canceled.plan,'pro');
});
test('Free includes full Overview, news and Home; market access depends on deployment entitlement rather than subscription',()=>{
 const free=resolveAccess({...input,licensed:true,config:{rules:{news:'free'}}});assert.equal(free.features.overview,true);assert.equal(free.features.news,true);assert.equal(free.features.home,true);assert.equal(free.features.advanced,false);assert.equal(free.sampleOnly,false);assert.equal(resolveAccess({...input,grant:{expiresAt:'2026-12-01'}}).sampleOnly,true);
});
