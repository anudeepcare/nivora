import test from 'node:test';
import assert from 'node:assert/strict';
import { paceChartBands, currentPaceChartPeriod } from '../lib/pace-chart-bands.ts';
const zones={date:'2026-11-13',reference:100,from:10,to:500,policy:'monthly-v7',ranges:[{level:2,low:80,high:90},{level:3,low:90,high:110},{level:2,low:110,high:120}]};
test('chart preserves disconnected conditional zones without inventing monotone thresholds',()=>{
 assert.deepEqual(paceChartBands(zones,'2026-11-15'),zones.ranges);
});
test('chart refuses missing, future, invalid or stale conditional bands',()=>{
 for(const day of ['bad','2026-11-12','2026-11-21']) assert.deepEqual(paceChartBands(zones,day),[]);
 assert.deepEqual(paceChartBands(null,'2026-11-15'),[]);
 assert.deepEqual(paceChartBands({...zones,ranges:[{level:9,low:1,high:2},{level:1,low:NaN,high:2},{level:1,low:5,high:2}]},'2026-11-15'),[]);
});

test('chart uses same fresh forming or confirmed period as current Pace',()=>{
 const now=Date.parse('2026-11-02');
 assert.equal(currentPaceChartPeriod({date:'2026-10-30',multiplier:2,forming:null},now),'confirmed');
 assert.equal(currentPaceChartPeriod({date:'2026-10-30',multiplier:2,forming:{date:'2026-11-01',multiplier:3}},now),'forming');
 assert.equal(currentPaceChartPeriod({date:'2026-10-20',multiplier:2},now),null);
 assert.deepEqual(paceChartBands(zones,'2026-11-18'),[]);
});
