import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url),root=path.resolve('.'),cache=new Map();
function load(file){
 const full=path.resolve(root,file);
 if(cache.has(full))return cache.get(full).exports;
 const mod={exports:{}};cache.set(full,mod);
 const output=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const localRequire=id=>{
  if(id==='lightweight-charts')return {};
  if(id.startsWith('@/')||id.startsWith('.')){
   const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(full),id);
   return load([base,base+'.ts',base+'.tsx'].find(x=>fs.existsSync(x)&&fs.statSync(x).isFile()));
  }
  return require(id);
 };
 new Function('require','module','exports',output)(localRequire,mod,mod.exports);return mod.exports;
}
const Overview=load('components/premium/AurynResearchOverviewV2.tsx').default;
const decision={newMoneyAction:'AVOID',ownerAction:'HOLD',longTermAction:'UNATTRACTIVE',confidenceScore:83,evidenceCompleteness:65,pillars:{business:{score:72,why:'Reported financial record'},valuation:{score:null},marketStructure:{score:40},catalystsRegime:{why:'Catalyst evidence'}},drivers:[],counterEvidence:[],hardVetoReasons:[]};
const renderOverview=extra=>renderToStaticMarkup(React.createElement(Overview,{decision,marketTruth:{},displayPrice:150,candles:[],chartLevels:{invalidation:91.5},executionLevelsAllowed:true,executionIntent:'WATCH',...extra}));
const renderBusiness=props=>{
 const file='components/research/BusinessEvidence.tsx';
 assert.ok(fs.existsSync(file),'Business evidence view is available');
 return renderToStaticMarkup(React.createElement(load(file).default,{symbol:'ACME',...props}));
};

test('durability counts exclude predecessor periods outside the comparable reporting cohort',()=>{
 const result=load('lib/research-evidence.ts').buildBusinessEvidence({fiveYearRecord:{history:[
  {year:2022,comparable:false,netIncome:100,operatingCashFlow:100},
  {year:2023,comparable:true,netIncome:-5,operatingCashFlow:-10},
  {year:2024,comparable:true,netIncome:4,operatingCashFlow:3},
 ]}},null,null);
 assert.equal(result.profitYears,'1 of 2 comparable years');
 assert.equal(result.cashYears,'1 of 2 comparable years');
});

test('canonical actions explain new money, existing ownership and the multi-year horizon independently',()=>{
 const html=renderOverview();
 assert.match(html,/New money · today/);
 assert.match(html,/Do not commit new money/);
 assert.match(html,/Existing position/);
 assert.match(html,/Retain existing exposure/);
 assert.match(html,/Multi-year outlook/);
 assert.match(html,/does not establish that the business thesis is broken/);
 for(const action of ['AVOID','HOLD','UNATTRACTIVE'])assert.match(html,new RegExp(action));
});
test('model confidence is explained as evidence quality rather than a probability of success',()=>{
 const html=renderOverview();
 assert.match(html,/83\/100 model confidence/);
 assert.match(html,/not a probability of profit/);
 assert.match(html,/65\/100/);
});
test('durability is not relabeled as moat and missing dimension values are not zero-score bars',()=>{
 const html=renderOverview({analystFundamentals:{companyDimensions:{durability:93,growth:null}}});
 assert.match(html,/Financial durability/);
 assert.doesNotMatch(html,/>Moat</);
 assert.doesNotMatch(html,/<progress[^>]*value="0"[^>]*aria-label="Growth"/);
});
test('decision map names price invalidation as a setup level',()=>{
 const html=renderOverview();
 assert.match(html,/SETUP INVALIDATION/);
 assert.doesNotMatch(html,/>THESIS(?: \/ SUPPORT)?</);
});
test('unavailable fundamental valuation explains what inputs are missing',()=>{
 const html=renderOverview({analystFundamentals:{method:'DCF_FCF_EARNINGS',independentCrossChecks:0,valuationState:'PARTIAL'}});
 assert.match(html,/Valuation inputs needed/);
 assert.match(html,/historical or peer cross-check/);
 assert.doesNotMatch(html,/researchEmpty[^>]*>Insufficient source-backed inputs/);
});
test('missing company data stays unavailable without a fake score, zero or currency',()=>{
 const html=renderBusiness({company:null,analystFundamentals:{companyDimensions:{durability:50}}});
 assert.match(html,/Revenue/);
 assert.match(html,/Moat unassessed/);
 assert.match(html,/No annual financial history/);
 assert.doesNotMatch(html,/\$0|USD 0|50\/100|0\/100/);
});
test('financial facts preserve reported currency, source period, losses and zero values',()=>{
 const html=renderBusiness({company:{name:'ACME',reportedMetrics:{revenue:1200000000,netIncome:-50000000,fcf:0,opMargin:0,leverage:70},rawMetrics:{revenue:null},dataQuality:{reportedCurrency:'EUR',warnings:[]},evidence:[{key:'revenue',value:1200000000,currency:'EUR',period:'2025 FY',periodEnd:'2025-12-31',filedAt:'2026-02-20',source:'SEC',sourceUrl:'https://www.sec.gov/Archives/example'}]}});
 assert.match(html,/EUR 1.20B/);
 assert.match(html,/-EUR 50.0M/);
 assert.match(html,/EUR 0/);
 assert.match(html,/0.0%/);
 assert.match(html,/2025-12-31/);
 assert.match(html,/2026-02-20/);
 assert.match(html,/href="https:\/\/www.sec.gov\/Archives\/example"/);
 assert.doesNotMatch(html,/USD|\$/);
});
test('unknown currency is disclosed and history never assumes dollars',()=>{
 const html=renderBusiness({company:{rawMetrics:{revenue:1200000000},fiveYearRecord:{history:[{year:'2025',revenue:1200000000,netIncome:20,operatingCashFlow:30}]}}});
 assert.match(html,/currency unverified/i);
 assert.doesNotMatch(html,/USD|\$/);
 assert.doesNotMatch(html,/Comparable reported periods/);
});
test('financial history discloses period comparability rather than turning a partial record into moat proof',()=>{
 const html=renderBusiness({company:{dataQuality:{reportedCurrency:'GBP',comparableHistory:false,warnings:['Annual periods are not comparable.']},fiveYearRecord:{score:90,history:[{year:'2025',currency:'GBP',periodEnd:'2025-06-30',revenue:900,netIncome:30,operatingCashFlow:40,comparable:false}]}},analystFundamentals:{companyDimensions:{durability:95}}});
 assert.match(html,/GBP 900/);
 assert.match(html,/Annual periods are not comparable/);
 assert.match(html,/Moat unassessed/);
 assert.doesNotMatch(html,/95\/100/);
});
test('heuristic moat scores and unresolved drivers are withheld',()=>{
 const html=renderBusiness({company:{fiveYearRecord:{score:95}},v4Analysis:{moat:{score:89,direction:'EXPANDING',drivers:[{text:'Strong brand',evidenceIds:['legacy:company:moat:record']}],threats:[]},factors:{MOAT:{validationState:'HEURISTIC'}}}});
 assert.match(html,/Moat unassessed/);
 assert.doesNotMatch(html,/89\/100|Strong brand|EXPANDING/);
});
test('explicit moat drivers and risks render only with resolvable source evidence',()=>{
 const html=renderBusiness({v4Analysis:{moat:{score:78,direction:'STABLE',drivers:[{text:'Contract renewal rate supports switching costs.',evidenceIds:['renewal']}],threats:[{text:'Largest customer reduced its orders.',evidenceIds:['customer']}]},factors:{MOAT:{validationState:'MEASURED',evidenceIds:['renewal','customer']}},evidenceRefs:[{id:'renewal',source:'ISSUER',asOf:'2026-01-31',validationState:'MEASURED'},{id:'customer',source:'SEC',asOf:'2026-02-20',validationState:'MEASURED'}]}});
 assert.match(html,/Contract renewal rate supports switching costs/);
 assert.match(html,/Largest customer reduced its orders/);
 assert.match(html,/2026-01-31/);
 assert.match(html,/78\/100/);
 assert.doesNotMatch(html,/Moat unassessed/);
});
test('resolved moat observations do not legitimize an aggregate score without its own source evidence',()=>{
 const html=renderBusiness({v4Analysis:{moat:{score:78,drivers:[{text:'Verified renewal observation.',evidenceIds:['renewal']}]},factors:{MOAT:{validationState:'MEASURED',evidenceIds:['missing']}},evidenceRefs:[{id:'renewal',source:'ISSUER',asOf:'2026-01-31',validationState:'MEASURED'}]}});
 assert.match(html,/Verified renewal observation/);
 assert.doesNotMatch(html,/78\/100/);
});
test('derived financial metrics use annual currency and provenance from matching source inputs',()=>{
 const common={currency:'CHF',periodStart:'2025-01-01',periodEnd:'2025-12-31',filedAt:'2026-02-20',source:'SEC',sourceUrl:'https://www.sec.gov/Archives/cash-flow'};
 const html=renderBusiness({company:{reportedMetrics:{currency:'CHF',fcf:30000000,opMargin:20,leverage:40},dataQuality:{reportedCurrency:'USD'},evidence:[{...common,key:'operatingCashFlow',value:50000000},{...common,key:'capex',value:20000000},{...common,key:'operatingIncome',value:40000000},{...common,key:'revenue',value:200000000},{...common,key:'liabilities',periodStart:null,value:40000000},{...common,key:'assets',periodStart:null,value:100000000}]}});
 assert.match(html,/CHF 30.0M/);
 assert.doesNotMatch(html,/USD 30.0M/);
 assert.doesNotMatch(html,/Reporting period unverified/);
 assert.match(html,/Operating cash flow less capital expenditure/);
});
test('reported totals and continuing operations retain their own amounts, source links and history labels',()=>{
 const common={currency:'USD',periodStart:'2025-01-01',periodEnd:'2025-12-31',filedAt:'2026-02-20',source:'SEC'};
 const html=renderBusiness({company:{reportedMetrics:{currency:'USD',netIncome:82500000,continuingNetIncome:9800000,fcf:-3681200000,continuingOperatingCashFlow:401900000},rawMetrics:{netIncome:9800000,fcf:null},dataQuality:{earningsBasis:'CONTINUING_OPERATIONS',cashFlowBasis:'CONTINUING_OPERATIONS'},evidence:[{...common,key:'reportedNetIncome',value:82500000,sourceUrl:'https://www.sec.gov/Archives/total'},{...common,key:'netIncome',value:9800000,sourceUrl:'https://www.sec.gov/Archives/continuing'},{...common,key:'reportedOperatingCashFlow',value:384800000,sourceUrl:'https://www.sec.gov/Archives/total-cash'},{...common,key:'operatingCashFlow',value:401900000,sourceUrl:'https://www.sec.gov/Archives/continuing-cash'},{...common,key:'capex',value:4066000000}],fiveYearRecord:{history:[{year:'2025',currency:'USD',netIncome:9800000,reportedNetIncome:82500000,operatingCashFlow:401900000,earningsBasis:'CONTINUING_OPERATIONS',cashFlowBasis:'CONTINUING_OPERATIONS'}]}}});
 const incomeCard=html.split('<small>Net income</small>')[1].split('</article>')[0];
 const cashCard=html.split('<small>Free cash flow</small>')[1].split('</article>')[0];
 assert.match(incomeCard,/USD 82.5M/);
 assert.match(incomeCard,/Reported total/);
 assert.match(incomeCard,/Continuing operations: USD 9.8M/);
 assert.match(incomeCard,/href="https:\/\/www.sec.gov\/Archives\/total"/);
 assert.doesNotMatch(incomeCard,/href="https:\/\/www.sec.gov\/Archives\/continuing"/);
 assert.match(cashCard,/Reported consolidated/);
 assert.match(cashCard,/Excluded from current-business valuation/);
 assert.match(cashCard,/href="https:\/\/www.sec.gov\/Archives\/total-cash"/);
 assert.match(html,/<td>USD 9.8M<small[^>]*>Continuing operations/);
});
