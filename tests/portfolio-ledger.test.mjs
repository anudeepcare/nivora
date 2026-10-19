import test from 'node:test';import assert from 'node:assert/strict';
import {ledgerRows,portfolioChartData} from '../lib/portfolio-ledger.ts';
const positions=[{id:'1',symbol:'A',quantity:2,cost:50,currency:'USD',assetType:'stock'},{id:'2',symbol:'A',quantity:1,cost:80,currency:'USD',assetType:'stock'},{id:'3',symbol:'B',quantity:2,cost:200,currency:'USD',assetType:'stock'},{id:'4',symbol:'C',quantity:1,cost:2,currency:'USD',assetType:'stock'},{id:'5',symbol:'USD',quantity:100,cost:1,currency:'USD',assetType:'cash'}];
const quotes={A:{price:100,currency:'USD',stale:false},B:{price:150,currency:'USD',stale:false},C:{price:10,currency:'USD',stale:true}};
test('ledger keeps value, cost basis, gains and aggregated position weights distinct',()=>{
 const rows=ledgerRows(positions,quotes,700,new Set(['B']));
 assert.equal(rows[0].value,200);assert.equal(rows[0].pnl,100);assert.equal(rows[0].returnPct,100);assert.ok(Math.abs(rows[0].weight-300/700*100)<1e-8);assert.equal(rows[2].note,'Earnings ≤7 days');assert.equal(rows[3].value,null);assert.equal(rows[3].pnl,null);assert.equal(rows[4].pnl,null);
 assert.equal(ledgerRows([{...positions[0],currency:'EUR'}],quotes,700)[0].pnl,null);
});
test('portfolio charts aggregate duplicate tickers and reconcile priced allocation without invented history',()=>{
 const x=portfolioChartData(positions,quotes);
 assert.equal(x.total,700);assert.equal(x.allocations.find(r=>r.symbol==='A').value,300);assert.equal(x.returns.find(r=>r.symbol==='A').pnl,120);assert.equal(x.returns.find(r=>r.symbol==='B').pnl,-100);assert.ok(!x.returns.some(r=>r.symbol==='USD'));assert.deepEqual(x.excluded,['C']);
 const unknown=portfolioChartData([{...positions[0],currency:null}],quotes);assert.equal(unknown.total,200);assert.equal(unknown.returns.length,0);
});
