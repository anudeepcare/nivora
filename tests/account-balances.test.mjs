import test from 'node:test';import assert from 'node:assert/strict';
import {cleanAccountBalances,accountEquity} from '../lib/account-balances.ts';
test('account equity deducts debt once and includes only separately recorded managed assets',()=>{
 assert.equal(accountEquity(800000,{margin_debt:116312,managed_value:120500}),804188);
 assert.equal(accountEquity(800000,{margin_debt:116312,managed_value:null}),683688);
 assert.equal(accountEquity(100,{margin_debt:200,managed_value:0}),-100);
});
test('account balance validation rejects negative, nonnumeric and nonfinite amounts without assuming a managed value',()=>{
 assert.deepEqual(cleanAccountBalances({margin_debt:116312,managed_value:null}),{margin_debt:116312,managed_value:null});
 for(const bad of [-1,NaN,Infinity,'120000',undefined]) assert.throws(()=>cleanAccountBalances({margin_debt:bad,managed_value:null}));
 assert.throws(()=>cleanAccountBalances({margin_debt:0,managed_value:-1}));
});

test('account money entry accepts readable USD formatting and rejects ambiguous or excessive decimals',async()=>{
 const {parseAccountMoney}=await import('../lib/account-balances.ts');
 assert.equal(parseAccountMoney('116,312'),116312);assert.equal(parseAccountMoney('$120,500.25'),120500.25);assert.equal(parseAccountMoney('',true),null);assert.equal(parseAccountMoney('0'),0);
 for(const invalid of ['','12,34','0.051001','-12','1e5','NaN'])assert.throws(()=>parseAccountMoney(invalid));
});
