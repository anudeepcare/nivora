import test from 'node:test';
import assert from 'node:assert/strict';
import { matchedBenchmark } from '../lib/account-benchmark.ts';
const flow=(date,type,amount)=>({date,type,amount});
const bars=[{date:'2026-01-02',adjusted_close:100},{date:'2026-01-05',adjusted_close:110},{date:'2026-01-06',adjusted_close:121}];
const dates=bars.map(b=>b.date);
test('matched deposits purchase only at their own close; withdrawals sell fractional units',()=>{
 const r=matchedBenchmark([flow(dates[0],'deposit',1000),flow(dates[1],'deposit',110),flow(dates[2],'withdrawal',121)],dates,bars);
 assert.deepEqual(r.map(p=>Math.round(p.value)),[1000,1210,1210]);
});
test('trades, dividends and fees are not external benchmark contributions',()=>{
 const r=matchedBenchmark([flow(dates[0],'deposit',1000),flow(dates[1],'dividend',500),flow(dates[1],'fee',20)],dates,bars);
 assert.equal(r.at(-1).value,1210);
});
test('missing valuation or external flow date, duplicates, invalid prices and unaffordable withdrawals fail closed',()=>{
 for(const [flows,prices] of [
 [[flow('2026-01-03','deposit',1000)],bars],
 [[flow(dates[0],'deposit',1000)],bars.slice(1)],
 [[flow(dates[0],'deposit',1000)],[...bars,bars[0]]],
 [[flow(dates[0],'deposit',1000)],bars.map(b=>({...b,adjusted_close:NaN}))],
 [[flow(dates[0],'deposit',1000),flow(dates[1],'withdrawal',1200)],bars],
 ]) assert.throws(()=>matchedBenchmark(flows,dates,prices));
});
test('adapter validates ETF identity and isolates unavailable benchmark without hiding the other', async()=>{
 const {accountBenchmarks}=await import('../lib/account-benchmark.ts');
 const calls=[];
 const result=await accountBenchmarks([flow(dates[0],'deposit',1000)],dates,dates[0],dates.at(-1),async(path,params)=>{
 calls.push([path,params]);
 if(path.startsWith('fundamentals/')) return {Code:path.includes('SPY')?'SPY':'QQQ',CurrencyCode:'USD',Type:path.includes('SPY')?'ETF':'Common Stock'};
 return bars;
 });
 assert.equal(result[0].status,'available');
 assert.equal(result[1].status,'unavailable');
 assert.deepEqual(result[1].points,[]);
 assert.equal(calls.length,3);
 assert.deepEqual(calls.find(c=>c[0]==='eod/SPY.US')[1],{from:dates[0],to:dates.at(-1),period:'d',order:'a'});
});
test('uniform adjusted-price rescaling cannot change matched cash-flow wealth',()=>{
 const flows=[flow(dates[0],'deposit',1000),flow(dates[1],'deposit',110)];
 assert.deepEqual(matchedBenchmark(flows,dates,bars),matchedBenchmark(flows,dates,bars.map(b=>({...b,adjusted_close:b.adjusted_close/4}))));
});
test('upstream provider failures do not leak raw exception details into comparison response',async()=>{
 const {accountBenchmarks}=await import('../lib/account-benchmark.ts');
 const r=await accountBenchmarks([],dates,dates[0],dates.at(-1),async()=>{throw Error('private upstream URL');});
 assert.ok(r.every(b=>b.status==='unavailable' && !b.reason.includes('private')));
});
