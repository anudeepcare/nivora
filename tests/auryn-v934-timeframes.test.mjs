import test from 'node:test';
import assert from 'node:assert/strict';

function bars({n=260,start=100,drift=.25,wiggle=2,volume=1_000_000,startDate='2025-01-01'}={}){
  const out=[]; let p=start; const d=new Date(`${startDate}T00:00:00.000Z`);
  for(let i=0;i<n;i++){
    const pulse=Math.sin(i/7)*wiggle+Math.cos(i/17)*wiggle*.4;
    const next=Math.max(2,p+drift+pulse*.08);
    const open=p,close=next,high=Math.max(open,close)+1+Math.abs(Math.sin(i))*1.2,low=Math.min(open,close)-1-Math.abs(Math.cos(i))*.9;
    out.push({datetime:new Date(d.getTime()+i*86400000).toISOString().slice(0,10),open,high,low,close,volume:volume*(1+(i%11)/25)});
    p=next;
  }
  return out;
}

await import('../.engine-test/auryn/v934/timeframes.js').catch(()=>{});
const tfmod=await import('../.engine-test/auryn/v934/timeframes.js');
const indmod=await import('../.engine-test/auryn/v934/indicators.js');
const {computeTimeframeTechnicalState}=tfmod;
const {computeRsi14,computeStochastic,computeCci,computeWilliamsR,computeRoc,computeAdx}=indmod;

test('indicator fixtures produce bounded deterministic values',()=>{
  const xs=bars({n:80,drift:.4});
  const closes=xs.map(x=>x.close);
  const a={
    rsi:computeRsi14(closes),
    stoch:computeStochastic(xs),
    cci:computeCci(xs),
    will:computeWilliamsR(xs),
    roc:computeRoc(closes),
    adx:computeAdx(xs)
  };
  const b={
    rsi:computeRsi14(closes),
    stoch:computeStochastic(xs),
    cci:computeCci(xs),
    will:computeWilliamsR(xs),
    roc:computeRoc(closes),
    adx:computeAdx(xs)
  };
  assert.deepEqual(a,b);
  assert.ok(a.rsi>=0&&a.rsi<=100);
  assert.ok(a.stoch.k>=0&&a.stoch.k<=100);
  assert.ok(a.will>=-100&&a.will<=0);
  assert.ok(a.adx.adx>=0&&a.adx.adx<=100);
  assert.ok(Number.isFinite(a.cci));
  assert.ok(Number.isFinite(a.roc));
});

test('same bars and timeframe always produce identical technical state',()=>{
  const xs=bars({n:280,drift:.32});
  const bench=bars({n:280,start:500,drift:.18,wiggle:1.2});
  const a=computeTimeframeTechnicalState(xs,bench,'1D','SPY');
  const b=computeTimeframeTechnicalState(xs,bench,'1D','SPY');
  assert.deepEqual(a,b);
  assert.equal(a?.timeframe,'1D');
  assert.ok(a && a.components.length>=20);
  assert.equal(a?.counts.buy+a?.counts.neutral+a?.counts.sell,a?.components.length);
});

test('insufficient history fails closed instead of fabricating a strong rating',()=>{
  const x=computeTimeframeTechnicalState(bars({n:12}),null,'4H',null);
  assert.equal(x,null);
});

test('different timeframes can legitimately carry different confirmed states',()=>{
  const bullish=computeTimeframeTechnicalState(bars({n:280,drift:.42}),bars({n:280,start:500,drift:.12}),'1W','SPY');
  const bearish=computeTimeframeTechnicalState(bars({n:280,start:200,drift:-.32}),bars({n:280,start:500,drift:.12}),'4H','SPY');
  assert.ok(bullish&&bearish);
  assert.notEqual(bullish.rating,bearish.rating);
  assert.ok(bullish.score>bearish.score);
});
