import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeModelProof,assessActionLadder,evaluatePromotionGate} from '../.engine-test/auryn/v6/proof.js';

const row=(action,alpha,horizon='90D',archetype='GENERAL_COMPOUNDER',regime='NEUTRAL',maxDrawdown=-8)=>({action,alphaPct:alpha,horizon,archetype,regime,maxDrawdownPct:maxDrawdown,confidenceScore:70});

test('model proof stays UNPROVEN without exact-engine matured evidence',()=>{
  const p=summarizeModelProof([]);
  assert.equal(p.grade,'UNPROVEN');
  assert.equal(p.exactSampleN,0);
  assert.equal(p.promotion.eligible,false);
  assert.match(p.promotion.blockers.join(' '),/exact-engine/i);
});

test('action ladder detects monotonic alpha ordering',()=>{
  const rows=[
    ...Array.from({length:20},()=>row('STRONG_BUY',12)),
    ...Array.from({length:20},()=>row('BUY',7)),
    ...Array.from({length:20},()=>row('HOLD',1)),
    ...Array.from({length:20},()=>row('REDUCE',-4)),
    ...Array.from({length:20},()=>row('SELL',-9)),
  ];
  const a=assessActionLadder(rows);
  assert.equal(a.monotonic,true);
  assert.deepEqual(a.orderedActions,['STRONG_BUY','BUY','HOLD','REDUCE','SELL']);
});

test('promotion gate blocks a challenger when action ladder is not monotonic',()=>{
  const rows=[
    ...Array.from({length:40},()=>row('STRONG_BUY',2)),
    ...Array.from({length:40},()=>row('BUY',8)),
    ...Array.from({length:40},()=>row('HOLD',1)),
  ];
  const proof=summarizeModelProof(rows);
  assert.equal(proof.actionLadder.monotonic,false);
  assert.equal(proof.promotion.eligible,false);
  assert.ok(proof.promotion.blockers.some(x=>/ladder/i.test(x)));
});

test('validated proof requires enough exact sample, positive alpha, drawdown control and multi-regime evidence',()=>{
  const rows=[];
  for(const regime of ['RISK_ON','NEUTRAL','RISK_OFF']){
    for(let i=0;i<30;i++) rows.push(row('STRONG_BUY',10,'90D','GENERAL_COMPOUNDER',regime,-9));
    for(let i=0;i<30;i++) rows.push(row('BUY',6,'90D','GENERAL_COMPOUNDER',regime,-8));
    for(let i=0;i<30;i++) rows.push(row('HOLD',1,'90D','GENERAL_COMPOUNDER',regime,-7));
    for(let i=0;i<30;i++) rows.push(row('REDUCE',-3,'90D','GENERAL_COMPOUNDER',regime,-6));
    for(let i=0;i<30;i++) rows.push(row('SELL',-7,'90D','GENERAL_COMPOUNDER',regime,-5));
  }
  const proof=summarizeModelProof(rows);
  assert.ok(['VALIDATED','ELITE'].includes(proof.grade));
  assert.equal(proof.promotion.eligible,true);
  assert.ok(proof.avgAlphaPct>0);
  assert.ok(proof.regimesCovered>=3);
});

test('ELITE proof is reserved for broad, strong and stable exact-engine evidence',()=>{
  const rows=[];
  for(const horizon of ['30D','90D','180D']) for(const regime of ['RISK_ON','NEUTRAL','RISK_OFF']){
    for(let i=0;i<35;i++) rows.push(row('STRONG_BUY',14,horizon,'GENERAL_COMPOUNDER',regime,-7));
    for(let i=0;i<35;i++) rows.push(row('BUY',9,horizon,'GENERAL_COMPOUNDER',regime,-7));
    for(let i=0;i<35;i++) rows.push(row('HOLD',2,horizon,'GENERAL_COMPOUNDER',regime,-6));
    for(let i=0;i<35;i++) rows.push(row('REDUCE',-5,horizon,'GENERAL_COMPOUNDER',regime,-5));
    for(let i=0;i<35;i++) rows.push(row('SELL',-10,horizon,'GENERAL_COMPOUNDER',regime,-5));
  }
  const proof=summarizeModelProof(rows);
  assert.equal(proof.grade,'ELITE');
  assert.equal(proof.promotion.eligible,true);
  assert.ok(proof.horizonsCovered>=3);
});
