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
 // CSS modules export class names; their stylesheet syntax is not JavaScript.
 if(full.endsWith('.module.css'))return Object.fromEntries([...fs.readFileSync(full,'utf8').matchAll(/\.([A-Za-z_][\w-]*)/g)].map(([,name])=>[name,name]));
 if(cache.has(full))return cache.get(full).exports;
 const mod={exports:{}};cache.set(full,mod);
 const output=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const localRequire=id=>{
  // Canvas lifecycle effects do not execute during server rendering.
  if(id==='lightweight-charts')return {};
  if(id.startsWith('@/')||id.startsWith('.')){
   const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(full),id);
   const target=[base,base+'.ts',base+'.tsx'].find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());
   return load(target);
  }
  return require(id);
 };
 new Function('require','module','exports',output)(localRequire,mod,mod.exports);return mod.exports;
}
const Overview=load('components/premium/AurynResearchOverviewV2.tsx').default;
const ActionMap=load('components/market/MarketActionMap.tsx').default;
const decision={newMoneyAction:'HOLD',ownerAction:'HOLD',longTermAction:'HOLD',confidenceScore:61,evidenceCompleteness:65,pillars:{business:{score:65,why:'Business evidence'},valuation:{score:50},marketStructure:{score:40},catalystsRegime:{why:'Catalyst evidence'}},drivers:[],counterEvidence:[],hardVetoReasons:[]};
const levels={entryLow:101.25,entryHigh:103.75,confirm:110.5,target1:119.25,invalidation:91.5};
const render=extra=>renderToStaticMarkup(React.createElement(Overview,{decision,canonical:{research:{state:'READY'}},marketTruth:{priceSensitiveAllowed:true},displayPrice:150,candles:[],chartLevels:levels,executionLevelsAllowed:true,executionIntent:'WATCH',...extra}));
test('overview withholds execution prices when the final trust/price gate is closed',()=>{
 const html=render({executionLevelsAllowed:false});
 for(const value of ['101.25','103.75','110.50','119.25','91.50'])assert.ok(!html.includes(value),`blocked level ${value} leaked into overview`);
 assert.match(html,/Execution levels unavailable/);
});
test('watch plan is described as structural context rather than an active entry',()=>{
 const html=render({executionIntent:'WATCH'});
 assert.match(html,/Support/);
 assert.match(html,/Support not confirmed/);
 assert.doesNotMatch(html,/Active entry is/);
});
test('reduce and exit plans cannot render new entry instructions from retained level data',()=>{
 for(const executionIntent of ['REDUCE','EXIT']){
  const html=render({executionIntent});
  assert.ok(!html.includes('101.25'));
  assert.match(html,/No new entry/);
 }
});
test('missing canonical market levels remain unavailable rather than zero dollars',()=>{
 const html=renderToStaticMarkup(React.createElement(ActionMap,{marketIntelligence:{snapshotId:'s',actionMap:{}}}));
 assert.doesNotMatch(html,/\$0(?:\.00)?/);
});
test('overview explains canonical setup and decision triggers without inventing another call',()=>{
 const html=render({decision:{...decision,setupState:'BREAKOUT_WATCH',nextDecisionTrigger:'Wait for verified participation.',invalidationTrigger:'The reported business thesis deteriorates.'}});
 assert.match(html,/Market setup/);
 assert.match(html,/approaching an important resistance/);
 assert.match(html,/Wait for verified participation/);
 assert.match(html,/reported business thesis deteriorates/);
});
test('pattern evidence is disclosed only when its source snapshot matches the current market snapshot',()=>{
 const scenario={snapshotId:'snapshot-a',setup:'DOUBLE BOTTOM',structure:'Transition',waveContext:{note:'Supporting pattern evidence'}};
 const ready=render({scenario,marketTruth:{snapshotId:'snapshot-a',priceSensitiveAllowed:true}});
 assert.match(ready,/Pattern evidence/);
 assert.match(ready,/tested a similar support area twice/);
 const stale=render({scenario,marketTruth:{snapshotId:'snapshot-b',priceSensitiveAllowed:true}});
 assert.doesNotMatch(stale,/tested a similar support area twice/);
});

const GlassValuation=load('components/research/GlassValuation.tsx').default;
const scenarios=Object.fromEntries(['bear','base','bull'].map(k=>[k,{value:120,assumptions:{growthPct:5,discountRatePct:10,terminalGrowthPct:2,dilutionPct:1}}]));
const valuation={scenarios,upsidePct:null,marginOfSafetyPct:null,priceComparisonAsOf:null,sensitivity:[],method:'DCF',missingInputs:[],warnings:[],why:'Price comparison is unverified'};
test('glass valuation never restores a price comparison rejected by the evidence engine',()=>{
 const html=renderToStaticMarkup(React.createElement(GlassValuation,{assessment:{valuation},price:80,evidence:{},onFinancials(){}}));
 assert.match(html,/Valuation unverified/);assert.doesNotMatch(html,/Potential margin of safety|50.0% upside/);
});
test('glass valuation uses canonical upside and fair-value-denominated safety margin',()=>{
 const html=renderToStaticMarkup(React.createElement(GlassValuation,{assessment:{valuation:{...valuation,upsidePct:17.6,marginOfSafetyPct:15,priceComparisonAsOf:'2026-10-16T12:00:00Z'}},price:1,evidence:{},onFinancials(){}}));
 assert.match(html,/Limited margin of safety/);assert.match(html,/17.6% upside/);assert.doesNotMatch(html,/11900/);
});
