import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {demoData} from './fixtures/demo.ts';
import {explorePosition} from '../lib/position-explorer.ts';
import {portfolioTotals} from '../lib/engine.ts';
import {researchEdge} from '../lib/edge-research.ts';
import * as format from '../lib/format.ts';
function render(selected=null, positions=demoData.workspace.positions) {
 const source=fs.readFileSync('components/PositionExplorer.tsx','utf8'),ast=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='PositionExplorer');
 const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const bindings={React,useState:()=>[selected,()=>{}],useId:()=> 'sizing',useMemo:React.useMemo,SlidersHorizontal:()=>null,ArrowUpRight:()=>null,Link:({children,...p})=>React.createElement('a',p,children),useProduct:()=>({workspace:{...demoData.workspace,positions},demo:demoData}),useWorkspaceQuotes:()=>({data:Object.fromEntries(Object.entries(demoData.research).map(([s,r])=>[s,{quote:r.quote}]))}),portfolioTotals,explorePosition,researchEdge,...format};
 const Component=new Function(...Object.keys(bindings),code+';return PositionExplorer;')(...Object.values(bindings));
 return renderToStaticMarkup(React.createElement(Component,{research:demoData.research.MSFT,reading:researchEdge(demoData.research.MSFT,true)}));
}
test('position explorer starts at exact current exposure without inventing a trade difference',()=>{
 const html=render(); assert.match(html,/<dd>\$10,715\.00<\/dd>/);assert.match(html,/<dd>\$0\.00<\/dd>/);
});
test('choosing zero through the explorer does not reset to a nonzero default',()=>{
 const html=render(0);assert.match(html,/<dd>\$0\.00<\/dd>/);assert.match(html,/Below current holding/);assert.doesNotMatch(html,/NaN|Infinity/);
});
test('cost currency does not erase a holding priced in USD from current exposure',()=>{
 const html=render(null,demoData.workspace.positions.map(p=>p.symbol==='MSFT'?{...p,currency:'EUR'}:p));assert.match(html,/<dd>\$10,715\.00<\/dd>/);
});
