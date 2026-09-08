import test from 'node:test';
import assert from 'node:assert/strict';

let mod;
try { mod = await import('../.engine-test/auryn/v9/feature-registry.js'); } catch {}

test('V9 generates a deterministic 20k+ unique hypothesis catalog across professional families',()=>{
  assert.ok(mod,'V9 feature registry must exist');
  const a=mod.generateFeatureCatalog();
  const b=mod.generateFeatureCatalog();
  assert.ok(a.length>=20000,`expected >=20k candidates, got ${a.length}`);
  assert.equal(a.length,new Set(a.map(x=>x.id)).size,'candidate IDs must be unique');
  assert.deepEqual(a.slice(0,100),b.slice(0,100),'catalog must be deterministic');
  const families=new Set(a.map(x=>x.family));
  for(const family of ['TREND','MOMENTUM','VOLATILITY','VOLUME_FLOW','STRUCTURE_PATTERN','RELATIVE_STRENGTH','FUNDAMENTALS','EARNINGS','VALUATION','NARRATIVE_CATALYST','SECTOR_MACRO','OPTIONS_POSITIONING','MICROSTRUCTURE']) assert.ok(families.has(family),`missing ${family}`);
  const theories=new Set(a.map(x=>x.theory));
  for(const theory of ['RSI','MACD','ICHIMOKU','FIBONACCI','ELLIOTT','WYCKOFF','WEINSTEIN','CAN_SLIM','ANCHORED_VWAP']) assert.ok(theories.has(theory),`missing ${theory}`);
});
