import test from 'node:test';
import assert from 'node:assert/strict';
let mod;
try { mod=await import('../.engine-test/auryn/v84/completed-bars.js'); } catch {}

const bars=[
  {datetime:'2026-09-04',open:90,high:101,low:89,close:100,volume:10},
  {datetime:'2026-09-08',open:105,high:110,low:104,close:109,volume:5},
];

test('regular-session technical analysis excludes a provider partial candle for the current trading day',()=>{
  assert.ok(mod,'V8.4 completed-bars module must exist');
  const out=mod.completedDailyBars(bars,{date:'2026-09-08',session:'REGULAR'});
  assert.equal(out.length,1);
  assert.equal(out[0].datetime,'2026-09-04');
});

test('after-hours analysis may include the completed current regular-session daily candle',()=>{
  assert.ok(mod,'V8.4 completed-bars module must exist');
  const out=mod.completedDailyBars(bars,{date:'2026-09-08',session:'AFTER_HOURS'});
  assert.equal(out.length,2);
  assert.equal(out.at(-1).datetime,'2026-09-08');
});
