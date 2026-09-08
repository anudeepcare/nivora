import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregateWeeklyBars,buildMultiTimeframeTechnical} from '../.engine-test/auryn/v6/timeframes.js';
import {computeTechnicalSnapshot} from '../.engine-test/nivora-technical-engine.js';

function dailyBars(n=280,{start=100,drift=.35,lateShock=0}={}){
  const out=[];let p=start;const base=new Date('2025-08-04T00:00:00Z');let d=new Date(base);
  while(out.length<n){
    if(d.getUTCDay()!==0&&d.getUTCDay()!==6){
      const i=out.length;const shock=i>n-15?lateShock:0;
      const open=p; p=Math.max(5,p+drift+shock+Math.sin(i/9)*.15);
      out.push({datetime:d.toISOString().slice(0,10),open,high:Math.max(open,p)+1,low:Math.min(open,p)-1,close:p,volume:1_000_000+i*1000});
    }
    d.setUTCDate(d.getUTCDate()+1);
  }
  return out;
}

test('weekly aggregation is deterministic and preserves OHLCV semantics',()=>{
  const rows=dailyBars(15);
  const weekly=aggregateWeeklyBars(rows);
  assert.ok(weekly.length>=3);
  assert.equal(weekly[0].open,rows[0].open);
  assert.ok(weekly[0].high>=weekly[0].open);
  assert.ok(weekly[0].low<=weekly[0].open);
  assert.ok(weekly[0].volume>rows[0].volume);
});

test('multi-timeframe regime marks bullish daily and weekly structure aligned',()=>{
  const rows=dailyBars(300,{drift:.45});
  const daily=computeTechnicalSnapshot(rows,null,null);
  const mt=buildMultiTimeframeTechnical(rows,daily);
  assert.ok(mt.weekly);
  assert.equal(mt.alignment,'ALIGNED_BULLISH');
  assert.ok(mt.weekly.strength>=60);
});

test('multi-timeframe regime identifies daily weakness against stronger weekly structure',()=>{
  const rows=dailyBars(300,{drift:.45,lateShock:-2.6});
  const daily=computeTechnicalSnapshot(rows,null,null);
  const mt=buildMultiTimeframeTechnical(rows,daily);
  assert.ok(mt.weekly);
  assert.ok(['DAILY_WEAK_WEEKLY_STRONG','MIXED'].includes(mt.alignment));
  assert.match(mt.summary,/weekly|daily/i);
});
