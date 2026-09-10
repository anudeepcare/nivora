import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>fs.readFileSync(p,'utf8');
const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
const stock=read('components/StockClient.tsx');
const nav=read('components/stock/StockEvidenceNav.tsx');
const css=read('app/auryn-product.css');

const tests=[];
const test=(name,fn)=>tests.push([name,fn]);

test('core decision shows all actionable levels without expansion',()=>{
  for(const label of ['PREFERRED ENTRY','CONFIRM','SUPPORT','T1','T2','RISK']) assert.match(brief,new RegExp(label));
  assert.match(brief,/executionPlan/);
  assert.doesNotMatch(brief,/<details|<summary|Full evidence & model trace/);
});

test('research hero excludes execution blocked state',()=>{
  assert.doesNotMatch(brief,/>EXECUTION</);
  assert.doesNotMatch(brief,/executionAction/);
  assert.match(brief,/RESEARCH ACTIVE/);
});

test('core story is concise and decision first',()=>{
  assert.match(brief,/WHY THIS CALL/);
  assert.match(brief,/WHAT UPGRADES IT/);
  assert.match(brief,/WHAT BREAKS IT/);
  assert.doesNotMatch(brief,/The three forces driving this decision|Ranked by policy influence|influence/);
});

test('stock page has no Astra product panel or import',()=>{
  assert.doesNotMatch(stock,/AstraAnalystPanel/);
  assert.doesNotMatch(stock,/institutionalEvidence/);
});

test('evidence navigation has no expandable More menu',()=>{
  assert.doesNotMatch(nav,/<details|<summary|>More</);
  assert.match(nav,/aurynEvidenceNav/);
});

test('technical setup evidence is directly visible without disclosure',()=>{
  const block=stock.match(/tab==="technical"[\s\S]*?tab==="options"/)?.[0]||'';
  assert.doesNotMatch(block,/<details|v932SupportDisclosure/);
  assert.match(block,/ScenarioMapPanel scenario=\{v5Analysis\.scenario\} mode="compact"/);
});

test('authoritative core UX uses restraint rather than line-heavy dashboard framing',()=>{
  assert.match(css,/V9\.3\.3 CORE UX/);
  assert.match(css,/\.v933LevelRail/);
  assert.match(css,/\.v933Story/);
  assert.match(css,/border:\s*0/);
});

test('research tabs inherit the same low-chrome editorial system',()=>{
  assert.match(css,/\.aurynThesisVerdict\{[^}]*border:0!important/s);
  assert.match(css,/\.aurynThesisScoreRail[^}]*border:0!important/s);
  assert.match(css,/\.aurynStockEvidenceSurface \.v383TechnicalStateGrid\{[^}]*border:0!important/s);
  assert.match(css,/\.v12Fund \.osList>div\{[^}]*border:0!important/s);
});

let failed=0;
for(const [name,fn] of tests){try{fn();console.log(`PASS ${name}`)}catch(e){failed++;console.error(`FAIL ${name}: ${e.message}`)}}
console.log(`AURYN V9.3.3 Core UX contract: ${tests.length-failed}/${tests.length} passed`);
if(failed)process.exit(1);
