import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {normalizeCashBalance,readCashBalance,saveCashBalance} from '../src/public/portfolio-cash.js';

test('cash balance accepts finite nonnegative USD amounts and rejects coercion',()=>{
  assert.deepEqual(normalizeCashBalance(2500),{status:'available',amount:2500,currency:'USD'});
  for(const value of [null,'2500',-1,Infinity,NaN])assert.equal(normalizeCashBalance(value).status,'invalid');
});

test('cash balance persists only normalized browser-local state',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  assert.equal(readCashBalance(storage).status,'unset');
  assert.equal(saveCashBalance(storage,125.5).status,'available');
  assert.deepEqual(JSON.parse(values.get('auryn.portfolio.cash.v1')),{amount:125.5,currency:'USD'});
  assert.equal(readCashBalance(storage).amount,125.5);
  assert.equal(saveCashBalance(storage,-10).status,'invalid');
  assert.equal(readCashBalance(storage).amount,125.5);
});

test('portfolio screen records cash locally and supplies it to reserve review',async()=>{
  const source=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');
  assert.match(source,/readCashBalance\(localStorage\)/);
  assert.match(source,/id="cash-balance-form"/);
  assert.match(source,/saveCashBalance\(localStorage/);
  assert.match(source,/cashState:cashBalance/);
  assert.match(source,/cashReservePercent:policy\.cashReserve/);
});
