import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('stock page builds one V5 canonical snapshot and projects it through the single institutional view',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/buildAurynV5Analysis/);
  assert.match(s,/const v5Analysis=useMemo/);
  assert.match(s,/InstitutionalDecisionBrief/);
  assert.doesNotMatch(s,/<StockV5Decision/);
  assert.doesNotMatch(s,/<ExecutionPlanPanel/);
  assert.match(s,/scenario={v5Analysis\?\.scenario\?\?null}/);
  assert.doesNotMatch(s,/ScenarioMapPanel scenario={v5Analysis\.scenario}/);
});

test('V5 hero removes developer engine/model-fit metadata from the primary decision surface',()=>{
  const s=read('components/stock/v5/StockV5Decision.tsx');
  assert.doesNotMatch(s,/ANALYST MODEL|MODEL FIT|EVIDENCE STATE|ENGINE/);
  assert.match(s,/NEW MONEY/);
  assert.match(s,/IF YOU OWN IT/);
  assert.match(s,/NOW/); assert.match(s,/SWING/); assert.match(s,/6–12M/); assert.match(s,/3–5Y/);
});

test('execution plan owns staged DCA labels and metric explorer groups professional evidence',()=>{
  const plan=read('components/stock/v5/ExecutionPlanPanel.tsx');
  assert.match(plan,/DCA/); assert.match(plan,/CONFIRMATION/); assert.match(plan,/INVALIDATION/);
  const metrics=read('components/stock/v5/ProfessionalMetricExplorer.tsx');
  assert.match(metrics,/Momentum|MOMENTUM/); assert.match(metrics,/Volatility|VOLATILITY/); assert.match(metrics,/Trend|TREND/); assert.match(metrics,/Business|BUSINESS/);
});

test('legacy V5 scenario remains available as evidence but the first-screen canonical setup owns presentation',()=>{
  const s=read('components/stock/v5/ScenarioMapPanel.tsx');
  assert.match(s,/BULL CASE/); assert.match(s,/BASE CASE/); assert.match(s,/BEAR CASE/); assert.match(s,/SETUP/);
  const stock=read('components/StockClient.tsx');
  assert.match(stock,/scenario={v5Analysis\?\.scenario\?\?null}/);
  assert.doesNotMatch(stock,/<ScenarioMapPanel/);
  const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
  assert.match(brief,/PATTERN EVIDENCE/);
  assert.match(brief,/describeSetupState/);
});

test('V5 stock surface never falls back to a legacy hero or a second action-plan calculator',()=>{
  const s=read('components/StockClient.tsx');
  assert.doesNotMatch(s,/<StockV5Decision|<StockDecisionSummary|<StockActionPlan/);
  assert.doesNotMatch(s,/<ExecutionPlanPanel/);
  assert.match(s,/AURYN CANONICAL ANALYSIS/);
});

test('Thesis normal UI exposes evidence confidence, not internal analyst model identifiers',()=>{
  const s=read('components/stock/StockThesisPanel.tsx');
  assert.doesNotMatch(s,/v4\.analystModel\.id|model fit/i);
  assert.match(s,/Evidence quality|Evidence confidence/i);
});

test('V5 technical tab removes legacy independently-calculated confluence/wave fallbacks',()=>{
  const s=read('components/StockClient.tsx');
  assert.doesNotMatch(s,/className="v32MarketLab"/);
  assert.doesNotMatch(s,/className="osTechGrid"/);
  assert.match(s,/levels={v5ChartLevels}/);
});

test('Business and technical tab headline scores are sourced from the same canonical values shown in their detail blocks',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/const canonicalBusinessScore=/);
  assert.match(s,/score={canonicalBusinessScore}/);
  assert.match(s,/\{canonicalBusinessLabel\}\{canonicalBusinessScore!=null\?` · \$\{canonicalBusinessScore\}\/100`/);
  assert.match(s,/score={technicalState\.strength}/);
});

test('V5 technical chart renders only canonical ExecutionPlan levels and does not pass legacy confluence targets',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/const v5ChartLevels=/);
  assert.match(s,/levels={v5ChartLevels}/);
  assert.match(s,/PriceChart candles={v5Analysis\.bars\.slice\([^\n]+ levels={v5ChartLevels} showTrend={true}\/>/);
  assert.doesNotMatch(s,/PriceChart candles={v5Analysis\.bars[^\n]+confluence=/);
});

test('Thesis factor grid consumes V5 professional metrics so unavailable valuation stays N/A everywhere',()=>{
  const s=read('components/stock/StockThesisPanel.tsx');
  assert.match(s,/const canonicalMetrics=v5\.metrics/);
  assert.doesNotMatch(s,/Object\.entries\(v4\.factors\)/);
  assert.match(s,/v5\.decision\.confidenceScore/);
  assert.match(s,/m\.available/);
});

test('5-year business record does not label an overall score with a different revenue-trend adjective',()=>{
  const s=read('components/StockClient.tsx');
  assert.doesNotMatch(s,/\{five\.score\}\/100 · \{five\.revenueTrend\}/);
  assert.match(s,/Revenue trend:/);
});

test('V5 decision, execution, scenario and evidence surfaces share the full stock-page width',()=>{
  const css=read('app/auryn-product.css');
  assert.match(css,/\.aurynExecutionPlanV5,\.aurynMetricExplorer,\.aurynScenarioMap\{[^}]*width:100%[^}]*max-width:none/s);
  assert.match(css,/\.aurynV5Unavailable\{/);
});
