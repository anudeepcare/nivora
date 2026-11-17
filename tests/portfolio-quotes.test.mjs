import test from 'node:test';import assert from 'node:assert/strict';
import {mergePortfolioQuotes,quoteCoverage,refreshIntervals} from '../lib/portfolio-quotes.ts';
import {portfolioTotals} from '../lib/engine.ts';import {ledgerRows,portfolioChartData} from '../lib/portfolio-ledger.ts';import {pricedInvestmentReturns,portfolioRiskSummary} from '../lib/product-attention.ts';
const old={price:10,currency:'USD',stale:true,asOf:'2026-10-16T20:00:00Z'},p={id:'1',symbol:'A',quantity:5,cost:8,currency:'USD',assetType:'stock'};
test('older quotes retain identical price, value, gains and exposure across portfolio surfaces',()=>{
 const q={A:old};assert.equal(portfolioTotals([p],q).knownValue,50);assert.equal(ledgerRows([p],q,50)[0].value,50);assert.equal(ledgerRows([p],q,50)[0].price,10);assert.equal(ledgerRows([p],q,50)[0].note,'Older price');assert.equal(portfolioChartData([p],q).total,50);assert.equal(pricedInvestmentReturns([p],q).pnl,10);assert.equal(portfolioRiskSummary([p],q,[],'2026-10-19').total,50);
});
test('failed, invalid and out-of-order refresh results never erase a prior usable valuation',()=>{
 const prior={A:{quote:old}};
 for(const next of [{A:{error:'timeout'}},{A:{quote:{...old,price:null}}},{A:{quote:{...old,price:999,asOf:'2026-10-15T20:00:00Z'}}}])assert.equal(mergePortfolioQuotes(prior,next,['A']).A.quote.price,10);
 const next=mergePortfolioQuotes(prior,{A:{quote:{...old,price:12,stale:false,asOf:'2026-10-19T16:00:00Z'}}},['A']);assert.equal(next.A.quote.price,12);assert.equal(portfolioTotals([p],{A:next.A.quote}).knownValue,60);
 assert.deepEqual(mergePortfolioQuotes(prior,{},['B']),{});
});
test('coverage separates never-priced and older quotes; refresh modes control polling explicitly',()=>{
 assert.deepEqual(quoteCoverage(['A','B','C','A'],{A:{quote:old},B:{quote:{...old,stale:false}}}),{current:1,older:1,unpriced:1});assert.equal(refreshIntervals.manual,0);assert.equal(refreshIntervals.balanced,300000);
 assert.equal(portfolioTotals([p],{A:{...old,currency:'EUR'}}).knownValue,0);
});
test('an invalid older quote is labelled unpriced rather than implying a usable older value',()=>{
 const row=ledgerRows([p],{A:{...old,price:null}},0)[0];assert.equal(row.value,null);assert.equal(row.note,'Price unavailable');
 const foreign=ledgerRows([p],{A:{...old,currency:'EUR'}},0)[0];assert.equal(foreign.note,'USD price needed');
});
