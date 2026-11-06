import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {demoData} from './fixtures/demo.ts';
import {researchEdge} from '../lib/edge-research.ts';
function render(r) {
 const source=fs.readFileSync('components/ResearchBalance.tsx','utf8');
 const ast=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ResearchBalance');
 const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const bindings={React,Check:()=>null,ArrowUpRight:()=>null,Scale:()=>null,Minus:()=>null,PositionExplorer:()=>null};
 const Component=new Function(...Object.keys(bindings),code+';return ResearchBalance;')(...Object.values(bindings));
 return renderToStaticMarkup(React.createElement(Component,{research:r,reading:researchEdge(r),onTab:()=>{}}));
}
test('missing fundamentals do not become supporting evidence',()=>{
 const r=structuredClone(demoData.research.MSFT); r.facts=[];r.evidence={};
 assert.deepEqual(researchEdge(r).brief.support,[]);
 const html=render(r);
 assert.match(html,/No supporting evidence available/);
 assert.doesNotMatch(html,/Review reported profitability, cash generation and funding together/);
});
