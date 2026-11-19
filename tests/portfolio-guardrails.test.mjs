import test from 'node:test';
import assert from 'node:assert/strict';
import { portfolioGuardrails } from '../lib/portfolio-guardrails.ts';
const base={portfolioValue:100000,cash:20000,complete:true,cashReservePercent:10,maxLossPercent:1};
test('cash reserve bounds hypothetical cash-funded additions',()=>{
 const x=portfolioGuardrails({...base,cashSpend:11000});assert.equal(x.reserve,10000);assert.equal(x.spendable,10000);assert.equal(x.reserveBreach,true);
 assert.equal(portfolioGuardrails({...base,cashSpend:10000}).reserveBreach,false);
 assert.equal(portfolioGuardrails({...base,cash:5000,cashSpend:1}).spendable,0);
});
test('defined loss is compared to portfolio budget without using bear-case guesses',()=>{
 assert.equal(portfolioGuardrails({...base,maximumLoss:1001}).lossBreach,true);
 assert.equal(portfolioGuardrails({...base,maximumLoss:1000}).lossBreach,false);
 assert.equal(portfolioGuardrails({...base,maximumLoss:Infinity}).lossBreach,true);
 assert.equal(portfolioGuardrails(base).lossBreach,null);
});
test('incomplete currencies/prices and invalid balances fail closed',()=>{
 for(const patch of [{complete:false},{cash:100001},{portfolioValue:0},{cash:NaN}])assert.equal(portfolioGuardrails({...base,...patch}).available,false);
 const x=portfolioGuardrails({...base,cashReservePercent:null,maxLossPercent:null,cashSpend:30000,maximumLoss:5000});assert.equal(x.reserveBreach,null);assert.equal(x.lossBreach,null);
});
