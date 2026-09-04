import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('V65.8 metric help exposes a single icon and score interpretation support',()=>{
 const s=read('components/v65/MetricInfo.tsx');
 assert.match(s,/score\?:number/);
 assert.match(s,/ScoreGuide/);
 assert.match(s,/v658ScoreBand/);
 assert.doesNotMatch(s,/v65MetricInfo v657MetricInfo/);
});

test('V65.8 decision hero uses compact decision gate and scored metric cards',()=>{
 const s=read('components/InvestorDecisionHero.tsx');
 assert.match(s,/DECISION GATE/);
 assert.match(s,/condition.*remaining/s);
 assert.match(s,/v658DecisionGate/);
 assert.match(s,/metric="business"[^>]*score=/);
 assert.match(s,/metric="opportunity"[^>]*score=/);
 assert.match(s,/metric="timing"[^>]*score=/);
});

test('V65.8 portfolio removes the open-holdings prerequisite copy and explains attention',()=>{
 const s=read('app/portfolio/page.tsx');
 assert.doesNotMatch(s,/Open a few holdings once/);
 assert.match(s,/MetricInfo title="Needs attention"/);
 assert.match(s,/v658PortfolioPriorityGrid/);
});

test('V65.8 trading lab presents the paper path as one readable funnel',()=>{
 const s=read('app/trading-lab/page.tsx');
 assert.match(s,/PAPER PATH/);
 assert.match(s,/v658PaperFunnel/);
 assert.match(s,/DECISIONS CHECKED/);
 assert.match(s,/COMPLETED TRADES/);
});
