import test from 'node:test';
import assert from 'node:assert/strict';
import {computeTechnicalSnapshot} from '../.engine-test/nivora-technical-engine.js';

function bars({n=260,start=20,daily=.0025,vol=1_000_000,burst=false}={}){
  const out=[]; let close=start;
  for(let i=0;i<n;i++){
    const wave=Math.sin(i/7)*.006;
    const accel=burst&&i>n-12?.018:0;
    const ret=daily+wave+accel;
    const open=close; close=Math.max(.5,close*(1+ret));
    const high=Math.max(open,close)*1.018, low=Math.min(open,close)*.982;
    out.push({datetime:`2026-${String(Math.floor(i/28)+1).padStart(2,'0')}-${String(i%28+1).padStart(2,'0')}`,open,high,low,close,volume:vol*(1+(i%5)*.06)});
  }
  return out;
}

test('technical snapshot exposes canonical indicator diagnostics and separated strength vs entry',()=>{
  const x=computeTechnicalSnapshot(bars({burst:true}),bars({daily:.0005}), 'SPY');
  assert.ok(x);
  assert.equal(x.indicatorVersion,'wilder-v1');
  assert.equal(x.technicalStateVersion,'auryn-tech-v2');
  assert.ok(x.indicators);
  assert.ok(Number.isFinite(x.indicators.rsi14));
  assert.ok(Number.isFinite(x.indicators.macd.histogram));
  assert.ok(Number.isFinite(x.indicators.atr14));
  assert.ok(Number.isFinite(x.indicators.realizedVol20));
  assert.ok(x.technicalState);
  assert.ok(x.technicalState.strength >= 65, `strength ${x.technicalState.strength}`);
  assert.ok(x.technicalState.entryQuality < x.technicalState.strength, `${x.technicalState.entryQuality} should be lower than ${x.technicalState.strength} after a sharp run`);
  assert.match(x.technicalState.state,/Bullish|Strong|Constructive/);
});

test('entry quality penalizes extension without converting technical trend to bearish',()=>{
  const x=computeTechnicalSnapshot(bars({burst:true,daily:.003}),null,null);
  assert.ok(x);
  assert.ok(x.technicalState.extensionRisk >= 60, `extension ${x.technicalState.extensionRisk}`);
  assert.ok(x.technicalState.entryQuality <= x.technicalState.strength);
  assert.notEqual(x.technicalState.state,'Bearish');
});
