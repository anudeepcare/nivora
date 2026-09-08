import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {buildPortfolioCioActions,normalizePortfolioCompanyAction}=await import('../.engine-test/auryn/v6/portfolio-adapter.js');

test('portfolio adapter normalizes owner-facing legacy actions into canonical company actions',()=>{
  assert.equal(normalizePortfolioCompanyAction('STRONG BUY'),'STRONG_BUY');
  assert.equal(normalizePortfolioCompanyAction('HOLD / ADD'),'BUY');
  assert.equal(normalizePortfolioCompanyAction('TRIM'),'REDUCE');
  assert.equal(normalizePortfolioCompanyAction('EXIT / REASSESS'),'SELL');
  assert.equal(normalizePortfolioCompanyAction('WATCH'),'HOLD');
});

test('portfolio CIO blocks correlated adds without changing the standalone company call',()=>{
  const risk={concentrationPct:35,largestPositionPct:20,largestSectorPct:52,effectivePositions:4,correlationWarning:null,riskLabel:'HIGH',sizingGate:'BLOCK ADD',maxNewPositionPct:0,notes:['Concentration high']};
  const actions=buildPortfolioCioActions({positions:[
    {symbol:'AAA',value:40000,archetype:'AI_INFRA',rawAction:'BUY'},
    {symbol:'BBB',value:30000,archetype:'AI_INFRA',rawAction:'HOLD'},
    {symbol:'USD',value:30000,archetype:null,rawAction:'HOLD',assetType:'CASH'}
  ],portfolioRisk:risk});
  const aaa=actions.find(x=>x.symbol==='AAA');
  assert.equal(aaa.companyAction,'BUY');
  assert.equal(aaa.portfolioAction,'WATCH');
  assert.match(aaa.reason,/blocks additional exposure/i);
});

test('portfolio page consumes V6 CIO actions for the visible capital-priority surface',()=>{
  const s=fs.readFileSync('app/portfolio/page.tsx','utf8');
  assert.match(s,/buildPortfolioCioActions/);
  assert.match(s,/actions:v6PortfolioActions/);
});
