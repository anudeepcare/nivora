import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPortfolioCioOverlay} from '../.engine-test/auryn/v6/portfolio-cio.js';

const risk=(riskLabel='LOW',sizingGate='NORMAL',maxNewPositionPct=5)=>({concentrationPct:10,largestPositionPct:12,largestSectorPct:22,effectivePositions:8,correlationWarning:null,riskLabel,sizingGate,maxNewPositionPct,notes:[]});

test('portfolio CIO can block a standalone BUY without changing company action',()=>{
  const x=applyPortfolioCioOverlay({independentAction:'BUY',portfolioRisk:risk('HIGH','BLOCK ADD',0),owns:true,currentPositionPct:8,sameArchetypeExposurePct:55});
  assert.equal(x.companyAction,'BUY');
  assert.equal(x.portfolioAction,'BLOCK_ADD');
  assert.equal(x.maxNewPositionPct,0);
  assert.equal(x.constrained,true);
});

test('moderate portfolio risk reduces sizing but preserves add eligibility',()=>{
  const x=applyPortfolioCioOverlay({independentAction:'BUY',portfolioRisk:risk('MODERATE','REDUCED',2.5),owns:false,currentPositionPct:0,sameArchetypeExposurePct:20});
  assert.equal(x.portfolioAction,'ADD');
  assert.equal(x.maxNewPositionPct,2.5);
  assert.equal(x.constrained,true);
});

test('large existing position blocks additional exposure even when standalone call is strong buy',()=>{
  const x=applyPortfolioCioOverlay({independentAction:'STRONG_BUY',portfolioRisk:risk(),owns:true,currentPositionPct:18,sameArchetypeExposurePct:25});
  assert.equal(x.companyAction,'STRONG_BUY');
  assert.equal(x.portfolioAction,'BLOCK_ADD');
  assert.equal(x.maxNewPositionPct,0);
});

test('sell/reduce company calls are never upgraded by a low-risk portfolio',()=>{
  const s=applyPortfolioCioOverlay({independentAction:'SELL',portfolioRisk:risk(),owns:true,currentPositionPct:5,sameArchetypeExposurePct:5});
  const r=applyPortfolioCioOverlay({independentAction:'REDUCE',portfolioRisk:risk(),owns:true,currentPositionPct:5,sameArchetypeExposurePct:5});
  assert.equal(s.portfolioAction,'REDUCE_EXPOSURE');
  assert.equal(r.portfolioAction,'REDUCE_EXPOSURE');
});

test('hold remains hold and does not manufacture an add instruction',()=>{
  const x=applyPortfolioCioOverlay({independentAction:'HOLD',portfolioRisk:risk(),owns:true,currentPositionPct:4,sameArchetypeExposurePct:10});
  assert.equal(x.portfolioAction,'HOLD');
  assert.equal(x.maxNewPositionPct,0);
});
