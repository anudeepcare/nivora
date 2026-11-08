import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {demoData} from './fixtures/demo.ts';
import {approvedResearch} from '../lib/approved-research.ts';
import {sameProviderSymbol} from '../lib/provider-symbol.ts';
function setup(){
 const source=fs.readFileSync('components/IntegratedResearch.tsx','utf8');
 const ast=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='IntegratedResearch');
 const code=ts.transpileModule(fn.getText(ast).replace('export default ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 let cursor=0;const states=[];
 const marker=name=>()=>React.createElement('p',null,name);
 const scope={React,useState:value=>{const i=cursor++;if(!(i in states))states[i]=typeof value==='function'?value():value;return[states[i],v=>{states[i]=v;}];},useEffect:()=>{},useMemo:f=>f(),useProduct:()=>({workspace:demoData.workspace,demo:demoData}),approvedResearch,sameProviderSymbol,s:{},consensusOutlook:()=>null,OverviewBrief:marker('brief'),PaceInstrument:marker('pace'),ResearchChanges:marker('changes'),EvidenceCrystal:marker('crystal'),SelectedValuation:marker('valuation'),AnalystTargets:marker('targets'),DataFreshness:marker('freshness'),ResearchEvidenceGrid:marker('all evidence'),CompanyMetrics:marker('contextual company metrics'),PositionExplorer:marker('funding and concentration review')};
 const View=new Function(...Object.keys(scope),code+';return IntegratedResearch;')(...Object.values(scope));
 const render=()=>{cursor=0;return View({research:demoData.research.MSFT,onTab:()=>{}});};
 return {render};
}
function find(tree,predicate){if(!tree||typeof tree!=='object')return null;if(predicate(tree))return tree;for(const child of React.Children.toArray(tree.props?.children)){const match=find(child,predicate);if(match)return match;}return null;}
test('active Research overview exposes contextual company metrics by default',()=>{
 assert.match(fs.readFileSync('components/Research.tsx','utf8'),/import DecisionOverview from "\.\/IntegratedResearch"/);
 const {render}=setup();assert.match(renderToStaticMarkup(render()),/contextual company metrics/);
});
test('active overview opens the existing funding review without loading it by default',()=>{
 const {render}=setup();let tree=render();assert.doesNotMatch(renderToStaticMarkup(tree),/funding and concentration review/);
 const details=find(tree,x=>x.type==='details'&&React.Children.toArray(x.props.children).some(c=>c?.type==='summary'&&c.props.children==='Review position size & cash'));
 assert.ok(details,'current overview needs a visible position review control');
 details.props.onToggle({currentTarget:{open:true}});
 assert.match(renderToStaticMarkup(render()),/funding and concentration review/);
});
