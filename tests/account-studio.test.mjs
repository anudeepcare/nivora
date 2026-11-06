import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as format from '../lib/format.ts';
import {portfolioTotals} from '../lib/engine.ts';
import {pricedInvestmentReturns} from '../lib/product-attention.ts';
const empty=()=>null, marker=name=>()=>React.createElement('div',{'data-surface':name}), Link=({children,...props})=>React.createElement('a',props,children);
function load(file,name,bindings={}) {
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
 const code=ts.transpileModule(node.getText(ast).replace('export default ','').replace('export ',''),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 return new Function(...Object.keys(bindings),code+`;return ${name};`)(...Object.values(bindings));
}
const position={id:'position-1',symbol:'APP',quantity:2,cost:100,currency:'USD',assetType:'stock'};
const quote={price:120,currency:'USD',changePct:2,asOf:'2026-10-23T20:00:00Z',stale:false};
for(const tab of ['holdings','allocation','risk']) test(`portfolio ${tab} view preserves its tools and the position editor`,()=>{
 const Portfolio=load('components/Workspace.tsx','Portfolio',{
  React,useMemo:React.useMemo,useRef:React.useRef,useState:v=>[v==='holdings'?tab:v,()=>{}],
  useProduct:()=>({workspace:{positions:[position]},demo:{routePrefix:'/preview'},mutate:()=>{}}),
  useWorkspaceQuotes:()=>({data:{APP:{quote}},ready:true,loading:false,mode:'balanced',changeMode:()=>{},refresh:()=>{}}),
  useWorkspaceFilter:()=>['',()=>{}],usePortfolioCalendar:()=>({data:{events:[]}}),portfolioTotals,pricedInvestmentReturns,
  quoteCoverage:()=>({current:1,older:0,unpriced:0}),...format,
  PageHeading:({title,action})=>React.createElement('header',null,React.createElement('h1',null,title),action),
  Notice:empty,FeatureGate:({children})=>children,AccountBalances:marker('balances'),PortfolioLedger:marker('holdings'),PortfolioCharts:marker('allocation'),SectorBenchmarks:marker('sectors'),PortfolioRiskSummary:marker('risk'),PortfolioExposure:marker('exposure'),Empty:empty,
  Plus:empty,RefreshCw:empty,Wallet:empty,X:empty,Link,
 });
 const html=renderToStaticMarkup(React.createElement(Portfolio));
 assert.match(html,/aria-label="Portfolio views"/);
 assert.match(html,new RegExp(`aria-pressed="true" aria-controls="portfolio-${tab}-view"`));
 assert.match(html,/id="position-dialog-title"/);assert.match(html,/Average cost/);assert.match(html,/Cost currency/);
 assert.match(html,/data-surface="balances"/);assert.match(html,/data-surface="holdings"/);
 if(tab==='allocation'){assert.match(html,/data-surface="allocation"/);assert.match(html,/data-surface="sectors"/);}
 if(tab==='risk'){assert.match(html,/data-surface="risk"/);assert.match(html,/data-surface="exposure"/);}
});
test('watchlist separates price, daily change and observation time and keeps crypto navigation',()=>{
 const Rows=load('components/Workspace.tsx','InvestmentRows',{React,useProduct:()=>({demo:false}),Link,...format,SecurityLogo:empty,ArrowUpRight:empty,Trash2:empty,Empty:empty,Bookmark:empty});
 const html=renderToStaticMarkup(React.createElement(Rows,{symbols:['ETH/USD'],quotes:{'ETH/USD':{company:{name:'Ethereum'},quote:{...quote,changePct:-3.5,stale:true}}},remove:()=>{}}));
 assert.match(html,/href="\/research\/ETH-USD"/);assert.match(html,/\-3.5%/);assert.match(html,/Older usable observation/);assert.match(html,/Remove ETH\/USD from watchlist/);assert.match(html,/<th>Price observed<\/th>/);
});
