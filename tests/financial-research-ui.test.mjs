import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),cache=new Map();
function load(file){const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;const m={exports:{}};cache.set(full,m);const js=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(id=>{if(id.startsWith('@/')||id.startsWith('.')){const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(full),id);return load([base,base+'.ts',base+'.tsx'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile()));}return require(id);},m,m.exports);return m.exports;}
const {buildFinancialAssessment}=load('lib/research-financial-assessment.ts');
const Business=load('components/research/BusinessEvidence.tsx').default;
const Workbench=load('components/research/ValuationWorkbench.tsx').default;
test('business-specific gaps and invalidators render without invented operational metrics',()=>{
  const financialAssessment=buildFinancialAssessment({symbol:'ASTS',businessModel:'SPACE_SATELLITE',asOf:'2026-10-16T12:00:00Z'});
  const html=renderToStaticMarkup(React.createElement(Business,{symbol:'ASTS',financialAssessment}));
  assert.match(html,/deployed capacity/i);assert.match(html,/Regulatory denial/);assert.match(html,/Source evidence needed/);assert.doesNotMatch(html,/5 satellites/);
});
test('canonical valuation limits remain visible above editable exploratory assumptions',()=>{
  const financialAssessment=buildFinancialAssessment({symbol:'ASTS',businessModel:'SPACE_SATELLITE',asOf:'2026-10-16T12:00:00Z'});
  const html=renderToStaticMarkup(React.createElement(Workbench,{symbol:'ASTS',businessModel:'SPACE_SATELLITE',financialAssessment}));
  assert.match(html,/Canonical valuation/);assert.match(html,/FRONTIER SCENARIO RUNWAY/);assert.match(html,/Exploratory scenarios/);assert.match(html,/listed share class/);
});
