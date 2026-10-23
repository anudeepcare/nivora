import test from 'node:test';import assert from 'node:assert/strict';
import {enterpriseExpectations,impliedOperatingMargin} from '../lib/expectation-engine.ts';
const p={revenue:1000,shares:100,cash:100,debt:200,growth:5,margin:20,tax:25,returnOnCapital:10,discount:10,terminalGrowth:2,years:5};
test('operating model reconciles reinvestment, enterprise value, net debt and per-share equity',()=>{
 const r=enterpriseExpectations(p);assert.equal(r.available,true);assert.ok(Math.abs(r.rows[0].nopat-157.5)<1e-8);assert.ok(Math.abs(r.rows[0].reinvestment-78.75)<1e-8);assert.ok(Math.abs(r.rows[0].fcff-78.75)<1e-8);assert.ok(Math.abs(r.price*100-(r.enterpriseValue-100))<1e-8);
 assert.ok(enterpriseExpectations({...p,debt:300}).price<r.price);
 assert.ok(enterpriseExpectations({...p,returnOnCapital:20}).price>r.price);
});
test('inverse model recovers margin without inventing an answer outside the search bounds',()=>{
 const r=enterpriseExpectations(p);assert.ok(Math.abs(impliedOperatingMargin(p,r.price)-20)<1e-6);assert.equal(impliedOperatingMargin(p,1e20),null);
});
test('invalid capital economics and funding deficits withhold price outputs',()=>{
 assert.equal(enterpriseExpectations({...p,terminalGrowth:10}).available,false);
 assert.equal(enterpriseExpectations({...p,shares:0}).available,false);
 const r=enterpriseExpectations({...p,growth:80,cash:0});assert.equal(r.available,false);assert.match(r.reason,/funding/i);
 assert.equal(enterpriseExpectations({...p,revenue:Infinity}).available,false);
});
