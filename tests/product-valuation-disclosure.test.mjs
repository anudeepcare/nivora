import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../lib/auryn/v99910/fundamental-analyst.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
const module = {exports: {}};
new Function('module', 'exports', 'require', compiled)(module, module.exports, require);
const {buildFundamentalAnalyst} = module.exports;
const complete = {rawMetrics: {revenue: 10000000, fcf: 2000000, revGrowth: 12, opMargin: 20, leverage: 30}, currentPrice: 100, marketCap: 100000000, fiveYearRecord: {score: 70}};

test('complete financial inputs do not hide the unimplemented independent valuation cross-check', () => {
  const result = buildFundamentalAnalyst({...complete, businessModel: 'GENERAL_COMPOUNDER'});
  assert.equal(result.decisionGrade, false);
  assert.equal(result.fairValue, null);
  assert.equal(result.fundamentalScenario, null);
  assert.ok(result.missingMethodInputs.some(x => /independent.*cross.check/i.test(x)));
  assert.equal(result.implementationState, 'VALIDATION_REQUIRED');
});

test('unimplemented sector models disclose a model gap rather than a refreshable quote failure', () => {
  const result = buildFundamentalAnalyst({...complete, businessModel: 'AI_DATA_CENTER_INFRA'});
  assert.equal(result.implementationState, 'MODEL_NOT_IMPLEMENTED');
  assert.ok(result.missingMethodInputs.some(x => /model.*not.*implemented/i.test(x)));
  assert.equal(result.marginOfSafety, null);
});

test('missing business history is unknown instead of a stable trajectory', () => {
  const result = buildFundamentalAnalyst({});
  assert.equal(result.trajectory, 'UNKNOWN');
  assert.equal(result.companyDimensions.durability, null);
});
