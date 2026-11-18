import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('Research restores gated notes and print tools in an explicit supporting view',()=>{
 const source=fs.readFileSync('components/Research.tsx','utf8');
 const ast=ts.createSourceFile('Research.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let view;
 function visit(n){
  if(ts.isObjectLiteralExpression(n)&&n.properties.some(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='title'&&p.initializer.getText(ast)==='"Notes & export"'))view=n;
  ts.forEachChild(n,visit);
 }
 visit(ast);
 assert.ok(view,'Unique saved research and print actions must remain reachable');
 const content=view.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='content').initializer;
 const compiled=ts.transpileModule('const content='+content.getText(ast)+';',{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 const r={company:{symbol:'TEST'}};
 for(const allowed of [false,true]){
  const element=new Function('React','FeatureGate','ResearchNotes','CompanyBrief','r',compiled+';return content;')(
   React,props=>props.feature==='advanced'&&allowed?props.children:React.createElement('span',null,'Access required'),
   props=>React.createElement('div',{'data-action':'notes'},props.research.company.symbol),
   props=>React.createElement('div',{'data-action':'print'},props.research.company.symbol),r);
  const html=renderToStaticMarkup(element);
  assert.equal(html.includes('data-action="notes"'),allowed);
  assert.match(html,/data-action="print"/);
 }
 for(const component of ['ResearchNotes','CompanyBrief']){
  assert.match(source,new RegExp(`const ${component} = dynamic\\(`));
  assert.match(source,new RegExp(`import\\("\\./${component}"\\)`));
 }
});
test('restored notes keep explicit save and preview guards rather than saving on mount',()=>{
 const source=fs.readFileSync('components/ResearchNotes.tsx','utf8');
 assert.match(source,/async function save\(e: React.FormEvent\)/);
 assert.match(source,/if \(demo\)[\s\S]*?Preview notes are illustrative/);
 assert.match(source,/onSubmit=\{save\}/);
 assert.match(source,/Snapshot saving is disabled/);
});
