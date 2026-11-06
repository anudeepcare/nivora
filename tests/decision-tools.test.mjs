import test from 'node:test';
import assert from 'node:assert/strict';
import { impliedExpectations, priceEvidence } from '../lib/decision-tools.ts';
test('required EPS solves desired price return with explicit multiple and horizon',()=>{
 const x=impliedExpectations({price:100,eps:5,years:2,multiple:20,annualReturn:10});
 assert.ok(Math.abs(x.requiredEps-6.05)<1e-10); assert.ok(Math.abs(x.gapPercent-21)<1e-8); assert.equal(x.consensusAnnualReturn,0);
});
test('invalid inputs and loss forecasts never create misleading growth percentages',()=>{
 assert.equal(impliedExpectations({price:100,eps:-2,years:2,multiple:20,annualReturn:10}).gapPercent,null);
 for(const values of [{price:0},{years:0},{multiple:0},{annualReturn:-100},{price:Infinity}]) assert.equal(impliedExpectations({price:100,eps:5,years:2,multiple:20,annualReturn:10,...values}),null);
});
test('price evidence excludes future bars and withholds a 52-week label for short history',()=>{
 const rows=[{time:'2026-11-01',close:100},{time:'2026-11-02',close:90},{time:'2026-12-02',close:200}];
 const x=priceEvidence(rows,'2026-11-05'); assert.equal(x.drawdown,-10); assert.equal(x.completeYear,false); assert.equal(x.high,100);
});
test('invalid contribution amounts never become a zero-dollar preview',async()=>{
 const {contributionAmount}=await import('../lib/decision-tools.ts');
 assert.equal(contributionAmount('1000000001'),null);assert.equal(contributionAmount('-1'),null);assert.equal(contributionAmount('oops'),null);assert.equal(contributionAmount(''),0);assert.equal(contributionAmount('250'),250);
});
