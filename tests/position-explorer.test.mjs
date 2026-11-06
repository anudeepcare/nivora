import test from 'node:test';
import assert from 'node:assert/strict';
const m = await import('../lib/position-explorer.ts').catch(() => ({}));
test('position explorer calculates target value and hypothetical share difference', () => {
  assert.equal(typeof m.explorePosition, 'function');
  const r=m.explorePosition({portfolioValue:10000,currentValue:500,price:25,weight:10,bearPrice:20});
  assert.equal(r.available,true); assert.equal(r.targetValue,1000);
  assert.equal(r.valueDifference,500); assert.equal(r.shareDifference,20);
  assert.equal(r.scenarioChange,-200); assert.equal(r.portfolioImpact,-2);
});
test('zero target is meaningful and never replaced by a default', () => {
  assert.equal(typeof m.explorePosition, 'function');
  const r=m.explorePosition({portfolioValue:10000,currentValue:500,price:25,weight:0,bearPrice:20});
  assert.equal(r.targetValue,0); assert.equal(r.valueDifference,-500); assert.equal(r.shareDifference,-20);
  assert.equal(r.scenarioChange,0);
});
test('resetting to the exact current weight leaves no hypothetical change', () => {
  const r=m.explorePosition({portfolioValue:38863,currentValue:10715,price:428.6,weight:10715/38863*100});
  assert.equal(r.targetValue,10715); assert.equal(r.valueDifference,0);
});
test('missing and invalid sizing inputs never become actionable numbers', () => {
  assert.equal(typeof m.explorePosition, 'function');
  const base={portfolioValue:10000,currentValue:500,price:25,weight:10};
  for(const patch of [{portfolioValue:0},{portfolioValue:NaN},{currentValue:-1},{price:null},{price:0},{price:Infinity},{weight:-1},{weight:101}]) assert.equal(m.explorePosition({...base,...patch}).available,false);
  assert.equal(m.explorePosition({...base,bearPrice:null}).scenarioChange,null);
  assert.equal(m.explorePosition({...base,bearPrice:NaN}).scenarioChange,null);
});
test('price-path geometry sorts observations, excludes bad values and preserves a flat series', () => {
  assert.equal(typeof m.pricePath, 'function');
  const flat=m.pricePath([{time:'2026-01-01',close:5},{time:'2026-01-02',close:5}]);
  assert.equal(flat.direction,'flat'); assert.match(flat.path,/M/); assert.doesNotMatch(flat.path,/NaN|Infinity/);
  assert.equal(m.pricePath([{time:'bad',close:10},{time:'2026-01-01',close:0}]),null);
  const up=m.pricePath([{time:'2026-01-02',close:20},{time:'2026-01-01',close:10},{time:'2026-01-03',close:NaN}]);
  assert.equal(up.direction,'up'); assert.equal(up.from,'2026-01-01'); assert.equal(up.through,'2026-01-02');
});
