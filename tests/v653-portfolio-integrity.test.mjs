import test from 'node:test';import assert from 'node:assert/strict';
import {calculatePortfolioIntelligence} from '../.engine-test/v65/portfolio.js';

test('null thesis values are not converted into fake 0/100 quality',()=>{
 const x=calculatePortfolioIntelligence([{assetType:'EQUITY',symbol:'A',quantity:1,price:100,thesisScore:null,companyScore:null,action:'HOLD'}]);
 assert.equal(x.scorableHoldings,0);
 assert.equal(x.health.components.find(c=>c.key==='thesis')?.reason,'No scorable equity holdings yet.');
});

test('portfolio thesis quality uses actual thesis evidence when available',()=>{
 const x=calculatePortfolioIntelligence([{assetType:'EQUITY',symbol:'A',quantity:1,price:100,thesisScore:82,action:'HOLD'},{assetType:'EQUITY',symbol:'B',quantity:1,price:100,thesisScore:68,action:'HOLD'}]);
 assert.equal(x.scorableHoldings,2);
 assert.equal(x.health.components.find(c=>c.key==='thesis')?.score,75);
});
