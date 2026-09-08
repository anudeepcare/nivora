import test from 'node:test';
import assert from 'node:assert/strict';
import {V8_GOLDEN_UNIVERSE,runV8RealityAudit} from '../.engine-test/auryn/v8/reality-audit.js';

test('V8 golden universe contains exactly 100 real ticker fixtures',()=>{
  assert.equal(V8_GOLDEN_UNIVERSE.length,100);
  assert.equal(new Set(V8_GOLDEN_UNIVERSE.map(x=>x.symbol)).size,100);
});

test('100-ticker offline Reality Audit has zero critical classification/model/lifecycle violations',()=>{
  const report=runV8RealityAudit();
  assert.equal(report.total,100);
  assert.equal(report.violations.length,0,report.violations.map(v=>`${v.symbol}: ${v.message}`).join('\n'));
  assert.equal(report.passed,100);
});
