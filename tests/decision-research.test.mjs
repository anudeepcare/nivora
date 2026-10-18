import test from 'node:test';
import assert from 'node:assert/strict';
import {fadeDcf, solveDcfGrowth, solveDcfReturn, anchorScore, researchDecision} from '../lib/decision-research.ts';
import {demoData} from './fixtures/demo.ts';
test('cash-flow sensitivity has a hand-checkable constant-growth perpetuity and solves back to its assumptions',()=>{
 const p={cashFlow:4,growth:0,terminal:0,discount:10};
 assert.ok(Math.abs(fadeDcf(p)-40)<1e-8);
 const p2={cashFlow:4,growth:12,terminal:2.5,discount:10};const v=fadeDcf(p2);
 assert.ok(Math.abs(solveDcfGrowth(p2,v)-12)<1e-7);
 assert.ok(Math.abs(solveDcfReturn(p2,v)-10)<1e-7);
 assert.equal(fadeDcf({...p,discount:0}),null);
 assert.equal(solveDcfGrowth(p2,1e12),null);
});
test('scores interpolate anchors, handle missing evidence and do not silently zero it',()=>{
 assert.equal(anchorScore(null,[[0,0],[10,10]]),null);
 assert.equal(anchorScore(5,[[0,0],[10,10]]),5);
 const r=researchDecision({...demoData.research.MSFT,facts:[],evidence:undefined});
 assert.equal(r.overall,null);assert.equal(r.lenses.find(x=>x.id==='moat').score,null);
 assert.ok(r.gaps.length);
});
test('cash-flow scenarios respect economic monotonicity and invalid assumptions',()=>{
 const p={cashFlow:4,growth:12,terminal:2,discount:10},v=fadeDcf(p);
 assert.ok(fadeDcf({...p,growth:16})>v);
 assert.ok(fadeDcf({...p,discount:12})<v);
 assert.ok(Math.abs(fadeDcf({...p,cashFlow:8})-2*v)<1e-8);
 for(const patch of [{cashFlow:-1},{cashFlow:NaN},{discount:2},{terminal:-1},{growth:101}])assert.equal(fadeDcf({...p,...patch}),null);
});
test('research preferences reject malformed saved settings',async()=>{
 const {sanitizeResearchPreferences}=await import('../lib/research-preferences.ts');
 assert.deepEqual(sanitizeResearchPreferences({style:'Strong buy',detail:'invalid',horizon:'day'}),{style:'Balanced',detail:'essential',horizon:'long'});
 assert.deepEqual(sanitizeResearchPreferences({style:'Quality',detail:'advanced',horizon:'swing'}),{style:'Quality',detail:'advanced',horizon:'swing'});
});
