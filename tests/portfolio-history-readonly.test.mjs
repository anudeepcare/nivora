import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const source=fs.readFileSync('components/AccountHistory.tsx','utf8');
const ast=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='AccountHistory');
const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
function render(result){
 let i=0;
 const bindings={React,useRef:v=>({current:v}),useState:v=>[i++===6?result:v,()=>{}],useEffect:()=>{},styles:new Proxy({},{get:(_,k)=>k}),amount:String};
 const View=new Function(...Object.keys(bindings),code+';return AccountHistory')(...Object.values(bindings));
 return renderToStaticMarkup(View({readOnly:true}));
}
test('portfolio shows no ledger review workflow or empty history placeholder',()=>{
 assert.equal(render(null),'');
 assert.equal(render({status:'unavailable',points:[]}),'');
 const page=fs.readFileSync('components/PortfolioPage.tsx','utf8');
 assert.match(page,/<AccountHistory readOnly/);
 assert.doesNotMatch(page,/Portfolio over time|Your portfolio in 30 seconds|reference.summaryDetails|Review recorded transactions/);
 assert.match(page,/<PortfolioLedger/); assert.match(page,/<TransactionWorkspace/);
});
test('valid saved chart remains with benchmark meaning and without rebuild actions',()=>{
 const html=render({status:'available',points:[{date:'2026-11-17',equity:100,netContributions:90,gain:10}],benchmarks:[],revision:1});
 assert.match(html,/Account value &amp; market comparison/);
 assert.match(html,/Account equity and net contributions/);
 assert.doesNotMatch(html,/Review ledger|Build account history|Review saved revision|type="checkbox"/);
});
