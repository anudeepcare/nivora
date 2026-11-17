import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAccumulation} from '../lib/accumulation-evaluation.ts';
import {monthEndSession} from '../lib/calendar.ts';
const bars=Array.from({length:72},(_,i)=>{const m=new Date(Date.UTC(2019,i,1)).toISOString().slice(0,7),close=i%12===0?55:100;return {time:monthEndSession(m),open:close,high:close,low:close,close,volume:1};});
test('adaptive evaluation deposits equal budgets, carries cash and executes after the signal',()=>{const r=evaluateAccumulation(bars,'2025-02-01T22:00:00Z',10);assert.equal(r.available,true);assert.equal(r.fixed.contributed,r.adaptive.contributed);assert.equal(r.adaptive.contributed,r.months*100);assert.ok(r.history.every(x=>x.cash>=0&&x.signalDate<x.executionDate));assert.ok(r.adaptive.costs>0);assert.equal(r.holdout.months,Math.ceil(r.months*.3));});
test('transaction costs reduce ending assets and future bars cannot change this evaluation',()=>{const a=evaluateAccumulation(bars,'2025-02-01T22:00:00Z',0),b=evaluateAccumulation(bars,'2025-02-01T22:00:00Z',100);assert.ok(b.adaptive.value<a.adaptive.value);assert.deepEqual(evaluateAccumulation([...bars,{time:'2030-01-31',open:1,high:1,low:1,close:1,volume:1}],'2025-02-01T22:00:00Z',0),a);assert.throws(()=>evaluateAccumulation(bars,'2025-02-01T22:00:00Z',-1));});
test('short histories withhold simulated results',()=>assert.equal(evaluateAccumulation(bars.slice(0,30),'2025-02-01T22:00:00Z').available,false));
