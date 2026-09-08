import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildModelHealth} from '../.engine-test/auryn/v6/model-health.js';

const snaps=[
 {id:1,decision:{primaryAction:'BUY',classification:{businessModel:'AI_DATA_CENTER_INFRA'},evidenceConfidence:{score:74}}},
 {id:2,decision:{primaryAction:'HOLD',classification:{businessModel:'AI_DATA_CENTER_INFRA'},evidenceConfidence:{score:68}}},
];
const outs=[
 {snapshot_id:1,horizon:'90D',alpha_pct:8,max_drawdown_pct:-7,benchmark_return_pct:6},
 {snapshot_id:2,horizon:'90D',alpha_pct:1,max_drawdown_pct:-5,benchmark_return_pct:-5},
];

test('model health converts exact Arena snapshots/outcomes into proof evidence',()=>{
  const h=buildModelHealth(snaps,outs);
  assert.equal(h.proof.exactSampleN,2);
  assert.equal(h.horizons['90D'].n,2);
  assert.equal(h.horizons['90D'].avgAlphaPct,4.5);
  assert.equal(h.regimeCounts.RISK_ON,1);
  assert.equal(h.regimeCounts.RISK_OFF,1);
});

test('model health API is exact-engine scoped and uses V6 proof engine',()=>{
  const src=fs.readFileSync('app/api/model-health/route.ts','utf8');
  assert.match(src,/AURYN_V6_ENGINE_VERSION/);
  assert.match(src,/nivora_v59_decision_snapshots/);
  assert.match(src,/nivora_v59_arena_outcomes/);
  assert.match(src,/\.eq\("engine_version",engine\)/);
  assert.match(src,/buildModelHealth/);
  assert.match(src,/searchParams.*archetype|q\.get\('archetype'\)/);
  assert.match(src,/classification\?\.businessModel/);
});
