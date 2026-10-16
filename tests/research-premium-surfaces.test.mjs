import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),cache=new Map();
function load(file){
 const full=path.resolve(file);
 // CSS modules export class names; their stylesheet syntax is not JavaScript.
 if(full.endsWith('.module.css'))return Object.fromEntries([...fs.readFileSync(full,'utf8').matchAll(/\.([A-Za-z_][\w-]*)/g)].map(([,name])=>[name,name]));
 if(cache.has(full))return cache.get(full).exports;
 const module={exports:{}};cache.set(full,module);
 const js=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',js)(id=>{
  if(id==='lightweight-charts')return {};
  if(id.startsWith('@/')||id.startsWith('.')){const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(full),id);return load([base,base+'.ts',base+'.tsx'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile()));}
  return require(id);
 },module,module.exports);return module.exports;
}
const {buildComparableAnnualSeries,default:Business}=load('components/research/BusinessEvidence.tsx');
const Overview=load('components/premium/AurynResearchOverviewV2.tsx').default;
const row=(year,value,extra={})=>({year:String(year),periodStart:`${year}-01-01`,periodEnd:`${year}-12-31`,currency:'USD',comparable:true,revenue:value,operatingCashFlow:value,cashFlowBasis:'REPORTED',evidence:['revenue','operatingCashFlow'].map(key=>({key,value,currency:'USD',source:'SEC',sourceUrl:`https://www.sec.gov/Archives/${year}`,periodStart:`${year}-01-01`,periodEnd:`${year}-12-31`,filedAt:`${year+1}-02-20`,scope:'ANNUAL',basis:'GAAP'})),...extra});
const company=rows=>({fiveYearRecord:{history:rows}});
const decision={newMoneyAction:'AVOID',ownerAction:'HOLD',longTermAction:'UNATTRACTIVE',confidenceScore:70,evidenceCompleteness:75,pillars:{business:{score:72,why:'Operating record'},valuation:{score:null},marketStructure:{score:40},catalystsRegime:{why:'Reported catalyst'}},drivers:[],counterEvidence:[],hardVetoReasons:[]};
const renderBusiness=rows=>renderToStaticMarkup(React.createElement(Business,{symbol:'ACME',company:company(rows)}));

test('annual visualizations keep zero and losses, while excluding unbridged predecessor periods',()=>{
 const series=buildComparableAnnualSeries(company([row(2022,999,{comparable:false}),row(2023,-20),row(2024,0),row(2025,30)]),'operatingCashFlow');
 assert.deepEqual(series.map(p=>p.value),[-20,0,30]);
 const html=renderBusiness([row(2023,-20),row(2024,0),row(2025,30)]);
 assert.match(html,/Operating cash flow trend: 2023: -USD 20; 2024: USD 0; 2025: USD 30/);
 assert.match(html,/class="surfaceZeroBar"/);
 assert.match(html,/class="surfaceBarNegative"/);
});
test('annual charts do not infer a trend from missing sources, partial periods or mismatched facts',()=>{
 const quarterly=row(2024,30);quarterly.evidence.forEach(x=>{x.periodStart='2024-10-01';x.scope='QUARTERLY'});
 const mismatch=row(2025,50);mismatch.evidence.forEach(x=>x.value=500);
 const undated=row(2022,10);undated.evidence.forEach(x=>x.sourceUrl=null);
 assert.deepEqual(buildComparableAnnualSeries(company([undated,quarterly,mismatch]),'revenue'),[]);
 const html=renderBusiness([row(2023,20)]);
 assert.match(html,/Comparable trend unavailable/);
 assert.doesNotMatch(html,/aria-labelledby="[^"]*"><title[^>]*>Revenue trend:/);
});
test('annual chart series never bridges currency or cash-flow accounting bases',()=>{
 const euro=row(2023,100,{currency:'EUR'});euro.evidence.forEach(x=>x.currency='EUR');
 const consolidated=row(2024,110);
 const continuing=row(2025,20,{cashFlowBasis:'CONTINUING_OPERATIONS'});
 assert.deepEqual(buildComparableAnnualSeries(company([euro,consolidated,continuing]),'revenue').map(p=>p.year),['2024','2025']);
 assert.deepEqual(buildComparableAnnualSeries(company([euro,consolidated,continuing]),'operatingCashFlow').map(p=>p.year),['2025']);
});
test('overview contains one canonical summary and sends scenario work to valuation',()=>{
 const html=renderToStaticMarkup(React.createElement(Overview,{symbol:'ACME',decision,marketTruth:{},candles:[],chartLevels:{},fundamentalScenario:{base:{value:999}},onOpenValuation:()=>{}}));
 assert.equal((html.match(/aria-label="Stock overview"/g)||[]).length,1);
 assert.match(html,/Three investment lenses/i);
 assert.match(html,/Valuation/);
 assert.doesNotMatch(html,/researchScenarios|Bear, base &amp; bull|999\.00/);
 assert.match(html,/aria-label="Decision evidence"/);
});
test('reported metrics carry accessible definitions and expandable original source evidence',()=>{
 const html=renderToStaticMarkup(React.createElement(Business,{symbol:'ACME',company:{reportedMetrics:{revenue:120},dataQuality:{reportedCurrency:'EUR'},evidence:[{key:'revenue',value:120,currency:'EUR',periodEnd:'2025-12-31',filedAt:'2026-02-20',source:'SEC',sourceUrl:'https://www.sec.gov/Archives/revenue'}]}}));
 assert.match(html,/aria-label="About Revenue"/);
 assert.match(html,/EUR 120/);
 assert.match(html,/<details class="surfaceMetricSource"><summary>Source &amp; basis/);
 assert.match(html,/2026-02-20/);
 assert.match(html,/href="https:\/\/www.sec.gov\/Archives\/revenue"/);
});
