import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>fs.readFileSync(p,'utf8');
const brief=read('components/stock/v931/InstitutionalDecisionBrief.tsx');
const nav=read('components/stock/StockEvidenceNav.tsx');
const tab=read('components/stock/StockTabContext.tsx');
const stock=read('components/StockClient.tsx');
const css=read('app/auryn-product.css');
const pkg=JSON.parse(read('package.json'));
const tasks=fs.existsSync('.vscode/tasks.json')?read('.vscode/tasks.json'):'';

const tests=[];
const check=(name,fn)=>tests.push([name,fn]);
check('institutional hero exists once in stock shell',()=>{
  assert.equal((stock.match(/<InstitutionalDecisionBrief/g)||[]).length,1);
});
check('primary decision brief uses compact strip and ranked driver list',()=>{
  assert.match(brief,/v932ActionStrip/);
  assert.match(brief,/v932DriverList/);
  assert.doesNotMatch(brief,/v931Pillars/);
  assert.doesNotMatch(brief,/v931EvidenceQuality/);
});
check('decision narrative includes why, counter evidence, change and triggers',()=>{
  assert.match(brief,/v932DecisionNarrative/);
  assert.match(brief,/WHY THIS CALL/);
  assert.match(brief,/STRONGEST COUNTER-EVIDENCE/);
  assert.match(brief,/WHAT CHANGED/);
  assert.match(brief,/NEXT DECISION TRIGGER/);
});
check('tab context does not repeat canonical AURYN action',()=>{
  assert.doesNotMatch(tab,/AURYN \{action/);
});
check('evidence nav is mobile-first sticky and scrollable',()=>{
  assert.match(css,/\.aurynEvidenceNav\{[^}]*position:sticky/s);
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.aurynEvidenceNav[^}]*overflow-x:auto/s);
});
check('primary v932 presentation avoids gray KPI card grid',()=>{
  assert.doesNotMatch(css,/\.v932DriverList[^\n]*grid-template-columns:repeat\(3/);
  assert.match(css,/\.v932DriverRow/);
});
check('extreme pro legacy diagnostics remain collapsed',()=>{
  assert.match(stock,/<details className="v931LegacyDiagnostics"/);
});
check('technical setup map is canonical but subordinate supporting evidence',()=>{
  const technical=stock.match(/tab==="technical"[\s\S]*?tab==="options"/i)?.[0]||'';
  assert.match(technical,/v932SupportDisclosure/);
  assert.match(technical,/ScenarioMapPanel scenario=\{v5Analysis\.scenario\} mode="full"/);
});
check('375px mobile contract exists',()=>{
  assert.match(css,/@media\(max-width:430px\)[\s\S]*?\.v932DecisionBrief/);
  assert.match(css,/overflow-x:hidden/);
});
check('VS Code and CLI reliability workflow exists',()=>{
  for(const k of ['verify:quick','verify:release','audit:live:30','audit:live:100','audit:live:500']) assert.ok(pkg.scripts?.[k],`${k} missing`);
  assert.match(tasks,/AURYN — Fast Reliability Gate/);
  assert.match(tasks,/AURYN — Live Audit 100/);
});

let failed=0;
for(const [name,fn] of tests){try{fn();console.log(`PASS ${name}`)}catch(e){failed++;console.error(`FAIL ${name}: ${e.message}`)}}
console.log(`AURYN V9.3.2 UX contract: ${tests.length-failed}/${tests.length} passed`);
if(failed)process.exit(1);
