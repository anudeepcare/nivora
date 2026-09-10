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
check('primary decision brief uses one premium canonical view',()=>{
  assert.match(brief,/v932ActionStrip/);
  assert.match(brief,/v932DriverList/);
  assert.doesNotMatch(brief,/Beginner|Extreme Pro|Research depth|v932Depth/);
  assert.doesNotMatch(brief,/depth===|onDepthChange/);
  assert.match(brief,/v932DeepEvidence/);
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
check('legacy duplicate decision hero is not rendered in stock shell',()=>{
  assert.doesNotMatch(stock,/<StockV5Decision/);
  assert.doesNotMatch(stock,/Extreme Pro · model diagnostics/);
  assert.doesNotMatch(stock,/const\[depth,setDepth\]/);
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


check('canonical call uses dark editorial premium treatment',()=>{
  assert.match(css,/\.v932DecisionCard\{[^}]*background:var\(--auryn-ink\)/s);
  assert.match(css,/\.v932Hero h2\{[^}]*color:var\(--auryn-gold-soft\)/s);
});
check('astra never exposes deployment secret names in product UI',()=>{
  const astra=read('components/stock/v931/AstraAnalystPanel.tsx');
  assert.doesNotMatch(astra,/OPENAI_API_KEY/);
  assert.match(astra,/Analyst review is unavailable in this deployment/);
});
check('one view keeps expert evidence progressively disclosed',()=>{
  assert.match(brief,/Full evidence & model trace/);
  assert.match(brief,/DECISION ATTRIBUTION/);
  assert.match(brief,/STRONGEST COUNTER-EVIDENCE/);
});

let failed=0;
for(const [name,fn] of tests){try{fn();console.log(`PASS ${name}`)}catch(e){failed++;console.error(`FAIL ${name}: ${e.message}`)}}
console.log(`AURYN V9.3.2 UX contract: ${tests.length-failed}/${tests.length} passed`);
if(failed)process.exit(1);
