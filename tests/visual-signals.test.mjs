import test from 'node:test';
import assert from 'node:assert/strict';
import {seriesDirection,companyAccent} from '../lib/visual-signals.ts';
test('chart direction describes the displayed history, with missing and invalid data neutral',()=>{
 assert.equal(seriesDirection([100,95,80]),'down');
 assert.equal(seriesDirection([80,75,100]),'up');
 assert.equal(seriesDirection([100,90,100]),'flat');
 for(const v of [[],[100],[NaN,100],[100,Infinity],[100,NaN,90]])assert.equal(seriesDirection(v),'unknown');
});
test('company accents remain stable by logo identity, independent of position or gain/loss',()=>{
 assert.equal(companyAccent('NVDA'),'#76B900');
 assert.equal(companyAccent('GOOG'),companyAccent('GOOGL'));
 assert.equal(companyAccent('ETH-USD'),companyAccent('ETH/USD'));
 assert.equal(companyAccent('UNKNOWN'),'#66717b');
 assert.notEqual(companyAccent('TSLA'),companyAccent('NVDA'));
});
