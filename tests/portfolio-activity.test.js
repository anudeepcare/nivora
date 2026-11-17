import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTransactionActivity} from '../src/public/portfolio-activity.js';

const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;');

test('transaction activity renders chronological local ledger evidence and correction controls',()=>{
  const html=renderTransactionActivity([
    {symbol:'AAPL.US',type:'BUY',shares:1.25,price:100,fees:1,date:'2026-01-02',currency:'USD'},
    {symbol:'AAPL.US',type:'SELL',shares:.25,price:120,fees:.5,date:'2026-02-02',currency:'USD'}
  ],esc);
  for(const term of['TRANSACTION ACTIVITY','2026-01-02','BUY','1.25','AAPL.US','\\$100\\.00','\\$1\\.00','data-transaction-remove="0"','2026-02-02','SELL'])assert.match(html,new RegExp(term));
  assert.doesNotMatch(html,/provider|live quote/i);
});

test('transaction correction controls are disabled while portfolio data needs recovery',()=>{
  const html=renderTransactionActivity([{symbol:'AAPL.US',type:'BUY',shares:1,price:100,fees:0,date:'2026-01-02',currency:'USD'}],esc,{disabled:true});
  assert.match(html,/data-transaction-remove="0" disabled/);
  assert.match(html,/Repair the preserved ledger before editing/);
});

test('empty activity state does not invent transactions',()=>{
  const html=renderTransactionActivity([],esc);
  assert.match(html,/No transactions recorded/);
  assert.doesNotMatch(html,/data-transaction-remove/);
});
