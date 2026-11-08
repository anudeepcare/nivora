import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarioStartingValues } from '../lib/scenario-inputs.ts';
const period = { start:'2025-01-01', end:'2025-12-31', currency:'USD', revenue:1000, cash:0, debt:200 };
test('starting values preserve explicit zero, reject currency conflicts and never substitute weighted shares',()=>{
 assert.deepEqual(scenarioStartingValues(period,'USD',100), {startRevenue:'1000',cash:'0',debt:'200',shares:'100'});
 assert.deepEqual(scenarioStartingValues(period,'EUR',100), {shares:'100'});
 assert.deepEqual(scenarioStartingValues({...period,revenue:NaN,cash:-1,weightedShares:50},'USD',null), {debt:'200'});
});

test('quarterly or undated periods cannot prefill annual scenario monetary inputs',()=>{
 assert.deepEqual(scenarioStartingValues({...period,end:'2025-03-31'},'USD',100),{shares:'100'});
 assert.deepEqual(scenarioStartingValues({...period,start:''},'USD',100),{shares:'100'});
});
