import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as lucide from 'lucide-react';
import * as format from '../lib/format.ts';
const load = (file, deps) => {
  const source = fs.readFileSync(file,'utf8');
  const code = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)(name=>{assert.ok(name in deps, name); return deps[name]},mod,mod.exports);
  return mod.exports;
};
test('Research explains one decision and retains every distinct risk and change condition without a second action headline',()=>{
  assert.ok(fs.existsSync('components/ResearchConclusion.tsx'),'research conclusion component is missing');
  const {default:View}=load('components/ResearchConclusion.tsx',{
    react:React,'react/jsx-runtime':jsx,'lucide-react':lucide,'@/lib/format':format,
    './ResearchConclusion.module.css':new Proxy({},{get:(_,k)=>k})
  });
  const decision={actionLabel:'Watch',headline:'Wait for evidence.',explanation:{label:'Evidence incomplete',detail:'Cash flow requires a comparable period.'},reasons:['A dated business reason'],risks:['Funding needs review.','Funding needs review.','Price is older.'],changeConditions:['Refresh financial evidence.','Wait for a confirmed close.']};
  const html=renderToStaticMarkup(React.createElement(View,{decision,asOf:'2026-11-14',onTab:()=>{}}));
  assert.match(html,/Evidence incomplete/);
  assert.match(html,/Cash flow requires a comparable period/);
  assert.match(html,/Refresh financial evidence/);
  assert.match(html,/Wait for a confirmed close/);
  assert.match(html,/Price is older/);
  assert.equal((html.match(/Funding needs review/g)||[]).length,1);
  assert.doesNotMatch(html,/<h[23][^>]*>Watch<\/h/);
});
test('Research composition retains visible metric grids and pairs conclusion with scenario evidence',()=>{
  const source=fs.readFileSync('components/IntegratedResearch.tsx','utf8');
  assert.match(source,/<ResearchConclusion/);
  assert.match(source,/<StockFacts research=\{r\}/);
  assert.doesNotMatch(source,/<CompanyMetrics research=\{r\}/);
  assert.match(source,/<ResearchEvidenceGrid research=\{r\}/);
  assert.doesNotMatch(source,/<OverviewBrief/);
  assert.doesNotMatch(source,/aria-label="Risks to review"/);
});

test('Research keeps a short initial read and retains additional considerations in a disclosure',()=>{
 const source=fs.readFileSync('components/ResearchConclusion.tsx','utf8');
 assert.match(source,/risks.map\(/);
 assert.match(source,/conditions.map\(/);
 assert.match(source,/Risks &amp; what would change the view/);
});
test('Home labels the followed-company sample rather than claiming broad market coverage',()=>{
 const source=fs.readFileSync('components/HomeMarketCards.tsx','utf8');
 assert.match(source,/Companies you follow/);
 assert.doesNotMatch(source,/THE BIG PICTURE|Market pulse/);
});
