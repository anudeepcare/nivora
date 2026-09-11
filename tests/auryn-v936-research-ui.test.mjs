import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;

const read=p=>fs.readFileSync(root+p,'utf8');

test('premium research overview exists and owns hero chart metrics and scenario balance',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.match(p,/AURYN CALL/);
 assert.match(p,/PriceChart/);
 assert.match(p,/KEY METRICS/);
 assert.match(p,/Scenario balance/);
 assert.match(p,/Pattern/);
 assert.match(p,/Reward \/ Risk/);
});

test('StockClient renders premium overview instead of the legacy institutional first-screen component',()=>{
 const s=read('components/StockClient.tsx');
 assert.match(s,/AurynResearchOverview/);
 assert.doesNotMatch(s,/<InstitutionalDecisionBrief decision=/);
});

test('overview relies on existing canonical evidence and introduces no provider fetch',()=>{
 const p=read('components/premium/AurynResearchOverview.tsx');
 assert.doesNotMatch(p,/fetch\(/);
 assert.doesNotMatch(p,/twelvedata|alpaca/i);
});
