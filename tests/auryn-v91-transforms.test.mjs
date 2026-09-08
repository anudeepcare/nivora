import test from 'node:test';
import assert from 'node:assert/strict';
let tr,ctx;
try { tr=await import('../.engine-test/auryn/v91/transforms.js'); ctx=await import('../.engine-test/auryn/v91/contexts.js'); } catch {}
const p=(value,price=100,regime='RISK_ON')=>({value,price,regime});

test('V9.1 implements all eight historical-only transforms deterministically',()=>{
  assert.ok(tr,'transforms module must exist');
  const series=[p(1,105),p(2,104),p(3,103),p(4,102),p(5,101),p(7,100),p(10,99),p(14,98)];
  const names=['LEVEL','SLOPE','ACCELERATION','PERCENTILE','DIVERGENCE','CROSSOVER','ZSCORE','REGIME_NORMALIZED'];
  for(const name of names){
    const a=tr.deriveTransformedSignal(name,series);
    const b=tr.deriveTransformedSignal(name,series);
    assert.equal(Number.isFinite(a),true,`${name} must be finite`);
    assert.equal(a,b,`${name} must be deterministic`);
  }
  assert.equal(tr.deriveTransformedSignal('LEVEL',series),14);
  assert.ok(tr.deriveTransformedSignal('SLOPE',series)>0);
  assert.ok(tr.deriveTransformedSignal('ACCELERATION',series)>0);
  assert.ok(tr.deriveTransformedSignal('PERCENTILE',series)>.8);
  assert.ok(tr.deriveTransformedSignal('DIVERGENCE',series)>0,'metric rising while price falls should be positive divergence');
});

test('V9.1 transforms refuse insufficient history instead of fabricating signals',()=>{
  assert.equal(tr.deriveTransformedSignal('ACCELERATION',[p(1),p(2)]),null);
  assert.equal(tr.deriveTransformedSignal('ZSCORE',[p(1),p(2),p(3)]),null);
  assert.equal(tr.deriveTransformedSignal('REGIME_NORMALIZED',[p(1),p(2)]),null);
});

test('V9.1 context confirmations require same-date evidence and never silently fall back to NONE',()=>{
  assert.ok(ctx,'contexts module must exist');
  const current={regime:'RISK_ON',metrics:{sector_relative_strength:1,relative_volume:.4,ma_stack:1,eps_revision_breadth:.3,fcf_yield:4,realized_vol20:20}};
  assert.equal(ctx.applyResearchContext('NONE',2,current),2);
  assert.equal(ctx.applyResearchContext('SECTOR_CONFIRM',2,current),2);
  assert.equal(ctx.applyResearchContext('MARKET_REGIME',2,current),2);
  assert.equal(ctx.applyResearchContext('VOLUME_CONFIRM',2,current),2);
  assert.equal(ctx.applyResearchContext('TREND_CONFIRM',2,current),2);
  assert.equal(ctx.applyResearchContext('VALUATION_CONFIRM',2,current),2);
  assert.equal(ctx.applyResearchContext('EARNINGS_CONFIRM',2,current),2);
  assert.equal(ctx.applyResearchContext('RISK_CONFIRM',2,current),2);
  assert.equal(ctx.applyResearchContext('SECTOR_CONFIRM',2,{regime:'RISK_ON',metrics:{}}),null);
  assert.equal(ctx.applyResearchContext('MARKET_REGIME',2,{regime:'NEUTRAL',metrics:{}}),null);
});
