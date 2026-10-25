import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {researchEdge} from '../lib/edge-research.ts';import {latestFinancialEvidence} from '../lib/analysis.ts';import * as format from '../lib/format.ts';import {demoData} from './fixtures/demo.ts';
function view(){const source=fs.readFileSync('components/EdgeOverview.tsx','utf8');const ast=ts.createSourceFile('EdgeOverview.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const fn=ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text==='EdgeOverview');const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const bindings={useProduct:()=>({workspace:null}),React,useMemo:React.useMemo,researchEdge,latestFinancialEvidence,...format,Help:({trigger})=>React.createElement('button',null,trigger),CaseRange:()=>React.createElement('div',null,'Shared scale'),PriceRiskCases:()=>React.createElement('div',null,'Historical risk'),AnalystTargets:()=>null};return new Function(...Object.keys(bindings),code+';return EdgeOverview;')(...Object.values(bindings));}
test('Edge overview renders decision, concrete evidence and separate confirmed/forming Pace without invalid values',()=>{const Component=view();for(const r of Object.values(demoData.research)){const html=renderToStaticMarkup(React.createElement(Component,{research:r,onTab:()=>{},chart:React.createElement('div',null,'Price chart')}));assert.match(html,/AURYN EDGE/);assert.match(html,/AURYN PACE/);assert.match(html,/Confirmed monthly reading/);assert.match(html,/Cash conversion/);assert.doesNotMatch(html,/NaN|Infinity|Revenue by business/);}});
test('Edge reading never labels unreconciled fundamentals a build opportunity',()=>{const r=structuredClone(demoData.research.MSFT);r.evidence={...r.evidence,reportingCurrency:r.quote.currency,ownership:{outstanding:1},highlights:{MarketCapitalization:1e15}};const reading=researchEdge(r);assert.equal(reading.verdict,'Evidence needed');assert.equal(reading.pace,0);});
test('banks do not inherit an operating-company cash-flow verdict',()=>{
 const r=structuredClone(demoData.research.MSFT);r.company.symbol='BANK';r.company.sector='Financial Services';r.evidence={...r.evidence,profile:{...r.evidence?.profile,sector:'Financial Services',industry:'Banks - Regional'}};
 const reading=researchEdge(r);assert.equal(reading.verdict,'Sector review');
});
test('positive current cash generation is not mislabeled as an improving cash trend',()=>{
 const r=structuredClone(demoData.research.MSFT);r.history=r.history.map((b,i)=>({...b,open:2000-i,close:2000-i,high:2001-i,low:1999-i}));
 const reading=researchEdge(r);assert.ok(reading.disconnect);assert.doesNotMatch(reading.disconnect.title,/improving/i);
});
test('a labelled recent settled close remains usable for research when a live quote is unavailable',()=>{
 const r=structuredClone(demoData.research.MSFT),bar=r.history.at(-1);r.quote={...r.quote,price:bar.close,asOf:bar.time+'T20:00:00Z',session:'Last available close',stale:true};r.priceObservedAt=new Date(Date.parse(r.quote.asOf)+86400000).toISOString();
 assert.equal(researchEdge(r).referenceBasis,'settled-close');
 r.priceObservedAt=new Date(Date.parse(r.quote.asOf)+6*86400000).toISOString();assert.equal(researchEdge(r).referenceBasis,'unavailable');
});
test('Detailed mode exposes the decision explanation while Simple keeps it collapsed',()=>{
 const Component=view(),props={research:demoData.research.MSFT,onTab:()=>{}};
 const simple=renderToStaticMarkup(React.createElement(Component,props));const detailed=renderToStaticMarkup(React.createElement(Component,{...props,pro:true}));
 assert.doesNotMatch(simple,/<details class="edge-method" open/);assert.match(detailed,/<details class="edge-method" open/);
});
