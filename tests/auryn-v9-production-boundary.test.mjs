import test from 'node:test';
import assert from 'node:assert/strict';
let mod;
try { mod=await import('../.engine-test/auryn/v9/production-registry.js'); } catch {}

test('only explicitly approved production candidates enter the production feature registry',()=>{
  assert.ok(mod,'V9 production registry must exist');
  const candidates=[
    {featureId:'good',status:'PRODUCTION_CANDIDATE',qValue:.01,promotion:{eligible:true}},
    {featureId:'shadow',status:'SHADOW',qValue:.01,promotion:{eligible:false}},
    {featureId:'rejected',status:'REJECTED',qValue:.8,promotion:{eligible:false}},
  ];
  const r=mod.createProductionFeatureRegistry({version:'v9-test',candidates,approvedFeatureIds:['good','shadow']});
  assert.deepEqual(r.featureIds,['good']);
  assert.equal(r.autoPromoted,false);
});
