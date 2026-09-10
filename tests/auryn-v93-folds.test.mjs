import test from 'node:test';
import assert from 'node:assert/strict';

let folds,policy;
try {
  folds=await import('../.engine-test/auryn/v93/folds.js');
  policy=await import('../.engine-test/auryn/v93/policy.js');
} catch {}

const isoDay=(n)=>{
  const d=new Date(Date.UTC(2020,0,1+n));
  return d.toISOString().slice(0,10);
};
const rows=Array.from({length:240},(_,i)=>({
  featureId:'f',symbol:`S${i%8}`,asOf:isoDay(i),archetype:i%2?'GROWTH':'COMPOUNDER',sector:i%3===0?'TECH':i%3===1?'INDUSTRIALS':'HEALTH',regime:i%2?'RISK_ON':'RISK_OFF',horizon:'20D',signal:i%2?1:-1,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4,costBps:8
}));

test('V9.3 creates four deterministic chronological expanding walk-forward folds',()=>{
  assert.ok(folds&&policy,'V9.3 fold/policy modules must exist');
  const a=folds.createPurgedWalkForwardFolds(rows,'20D',policy.V93_POLICY);
  const b=folds.createPurgedWalkForwardFolds(rows,'20D',policy.V93_POLICY);
  assert.deepEqual(a,b);
  assert.equal(a.length,4);
  for(let i=0;i<a.length;i++){
    const f=a[i];
    assert.ok(f.trainRows.length>0);
    assert.ok(f.testRows.length>=15);
    assert.ok(f.trainEnd < f.testStart,'training must finish before the OOS fold starts');
    if(i>0) assert.ok(a[i-1].testEnd < f.testStart,'OOS folds must not overlap');
  }
});

test('V9.3 purges training labels far enough from the OOS boundary for the horizon',()=>{
  assert.ok(folds&&policy,'V9.3 fold/policy modules must exist');
  const out=folds.createPurgedWalkForwardFolds(rows,'20D',policy.V93_POLICY);
  const purgeDays=policy.V93_POLICY.purgeCalendarDays['20D'];
  assert.ok(purgeDays>=20);
  for(const f of out){
    const trainEnd=new Date(`${f.trainEnd}T00:00:00Z`).getTime();
    const testStart=new Date(`${f.testStart}T00:00:00Z`).getTime();
    const days=(testStart-trainEnd)/86400000;
    assert.ok(days>purgeDays,`purge gap ${days} must exceed configured ${purgeDays}`);
  }
});
