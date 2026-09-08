import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('canonical professional metrics include ownership, narrative and macro context',()=>{
 const s=read('lib/auryn/v5/metrics.ts');
 assert.match(s,/POSITIONING:\{id:'positioning'/);
 assert.match(s,/NARRATIVE_EXPECTATIONS:\{id:'narrative'/);
 assert.match(s,/MACRO_REGIME:\{id:'macro'/);
});

test('every decision-bearing stock tab references the same V5 action',()=>{
 const s=read('components/StockClient.tsx');
 const matches=s.match(/action={v5Analysis\?\.decision\.primaryAction}/g)||[];
 assert.ok(matches.length>=6,`expected canonical action on all major tabs, saw ${matches.length}`);
 assert.doesNotMatch(s,/action={presentedDecision\?\.today|action={investorDecision/);
});

test('business, earnings, ownership and catalysts tab factor values can be read from V5 metric ids',()=>{
 const s=read('components/StockClient.tsx');
 assert.match(s,/canonicalMetricScore\("businessQuality"\)/);
 assert.match(s,/canonicalMetricScore\("fundamentals"\)/);
 assert.match(s,/canonicalMetricScore\("positioning"\)/);
 assert.match(s,/canonicalMetricScore\("catalysts"\)/);
});

test('technical tab distinguishes watch zone from active DCA and uses canonical plan only',()=>{
 const s=read('components/StockClient.tsx');
 assert.match(s,/executionPlan\.intent==="ACCUMULATE"\?"DCA \/ INITIAL ENTRY":"STRUCTURAL WATCH ZONE"/);
 assert.match(s,/v5ChartLevels/);
 assert.doesNotMatch(s,/ScenarioMapPanel[^\n]+buildScenarioMap/);
});

test('Options tab uses canonical action and blocks price-sensitive research when Market Truth is unverified',()=>{
 const s=read('components/StockClient.tsx');
 assert.match(s,/UNDERLYING CALL/);
 assert.match(s,/v5Analysis\?formatInvestmentAction\(v5Analysis\.decision\.primaryAction\)/);
 assert.match(s,/UNDERLYING PRICE UNVERIFIED/);
});
