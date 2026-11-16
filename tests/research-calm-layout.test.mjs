import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as icons from 'lucide-react';
import * as format from '../lib/format.ts';
import {customerText} from '../lib/customer-language.ts';
import {renderToStaticMarkup} from 'react-dom/server';
const Dialog = ({trigger,children}) => React.createElement("section", {"data-modal":"test-open"}, React.createElement("button", {"aria-haspopup":"dialog"}, trigger), children);
function load(file, deps = {}) {
 const code = ts.transpileModule(fs.readFileSync(`components/${file}.tsx`, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(name => {
  if(name.endsWith('.module.css')) return {__esModule:true,default:new Proxy({}, {get:(_,k)=>k})};
  const modules={react:React,'react/jsx-runtime':jsx,'lucide-react':icons,'@/lib/format':format,'@/lib/customer-language':{customerText},'./Ui':{Help:({children})=>React.createElement('aside',null,children)},'./DetailDialog':{__esModule:true,default:Dialog},...deps};
  assert.ok(name in modules,name); return modules[name];
 },mod,mod.exports);
 return mod.exports.default;
}
function visible(node) {
 if(!React.isValidElement(node)) return node;
 if(node.type===Dialog) return React.createElement('button',{'aria-haspopup':'dialog'},node.props.trigger);
 const children=React.Children.toArray(node.props.children);
 return React.cloneElement(node,{},...(node.type==='details'&&!node.props.open?children.filter(x=>x.type==='summary'):children).map(visible));
}
test('the short read puts all risk and change detail in a dialog without expanding its card',()=>{
 const View=load('ResearchConclusion');
 const tree=View({decision:{explanation:{label:'Business evidence incomplete',detail:'Review cash generation.'},risks:['Funding is unproven.'],changeConditions:['Wait for comparable accounts.']},asOf:'2026-11-15',onTab:()=>{}});
 const initial=renderToStaticMarkup(visible(tree));
 assert.match(initial,/Review cash generation/);
 assert.doesNotMatch(initial,/Funding is unproven|Wait for comparable accounts/);
 const full=renderToStaticMarkup(tree);
 assert.match(full,/Funding is unproven/); assert.match(full,/Wait for comparable accounts/);
 assert.doesNotMatch(full, /<details/);
 assert.match(full, /data-modal="test-open"/);
});
test('missing scenario evidence keeps all three labelled cases visible with a reason',()=>{
 const View=load('StockPillars',{'@/lib/stock-pillars':{stockPillars:()=>({cases:null,casesUnavailableReason:'A dated annual earnings forecast is needed.',pillars:[],summary:'Unavailable'})},'@/lib/outlook':{consensusOutlook:()=>null}});
 const html=renderToStaticMarkup(React.createElement(View,{research:{},decision:{}}));
 for(const name of ['bear','base','bull']) assert.match(html,new RegExp(`data-case="${name}"`));
 assert.match(html,/A dated annual earnings forecast is needed/);
 assert.equal((html.match(/Not available/g)||[]).length,3);
});
test('business checks retain every explanation inside the detail dialog',()=>{
 const View=load('StockPillars',{'@/lib/stock-pillars':{stockPillars:()=>({cases:null,pillars:[{id:'growth',status:'supportive',question:'Growing?',answer:'Growing steadily',why:'Revenue rose 8%.'}],summary:'Working for it: growth.'})},'@/lib/outlook':{consensusOutlook:()=>null}});
 const html=renderToStaticMarkup(React.createElement(View,{research:{},decision:{}}));
 assert.match(html,/<section class="pillarDetail"><header>/);
 assert.match(html,/data-modal="test-open"/);
 assert.match(html,/Revenue rose 8%/);
});
test('research navigation names the current company alongside its sections',()=>{
 const source=fs.readFileSync('components/Research.tsx','utf8');
 assert.match(source,/className=\{navigationStyle\.symbol\}/);
 assert.match(source,/\{r\.company\.symbol\}<\/span>/);
 assert.match(source,/navigationStyle\.sections/);
});
test('technical chart avoids repeating momentum and volume and groups the full study library',()=>{
 const s=fs.readFileSync('components/TechnicalDashboard.tsx','utf8');
 assert.doesNotMatch(s,/className="technical-summary-strip"/);
 assert.match(s,/<DetailDialog[\s\S]*?key=\{g.title\}[\s\S]*?title=\{g.title\}/);
 assert.match(s,/g.rows.map/);
});
test('financial durability preserves its metrics while disclosing duplicate history charts',()=>{
 const s=fs.readFileSync('components/BusinessHistory.tsx','utf8');
 assert.match(s,/trigger="Historical charts"/);
 assert.match(s,/className="durability-grid"/);
});
test('Labs leads with its tools and opens reported Congress activity in a popup',()=>{
 const s=fs.readFileSync('components/Research.tsx','utf8');
 assert.match(s, /title="Reported congressional activity"/);
 assert.match(s, /trigger="Reported congressional activity"/);
 assert.ok(s.indexOf('<AdvancedResearch')<s.indexOf('<CongressDisclosures'));
});
test('analyst desk links to canonical valuation instead of duplicating model views',()=>{
 const s=fs.readFileSync('components/TargetsEstimates.tsx','utf8');
 assert.match(s,/onValuation[\s\S]*tabs.slice\(0, 2\)/);
 assert.match(s,/onClick=\{onValuation\}/);
});
test('independent financial detail periods are labelled at their controls',()=>{
 const s=fs.readFileSync('components/FinancialDetailTable.tsx','utf8');
 assert.match(s,/Table period is independent of the overview above/);
});
test('advanced secondary measurements open on demand after the primary charts',()=>{
 const s=fs.readFileSync('components/AdvancedDashboard.tsx','utf8');
 assert.match(s,/trigger="Recovery & volatility detail"/);
 assert.match(s,/className="advanced-chart-grid"/);
});
test('Research analyst navigation exposes two views and activates the Valuation handoff', async()=>{
 const {demoData}=await import('./fixtures/demo.ts');
 const targets=await import('../lib/targets-estimates.ts');
 const outlook=await import('../lib/outlook.ts');
 const View=load('TargetsEstimates',{
  react:{...React,useMemo:f=>f(),useState:v=>[v,()=>{}]},
  '@/lib/targets-estimates':targets,'@/lib/outlook':outlook,
  ...Object.fromEntries(['AnalystTargets','EstimateRevisions','PriceRiskCases','SelectedValuation'].map(name=>[`./${name}`,{__esModule:true,default:()=>null}]))
 });
 let opened=0;
 const tree=View({research:demoData.research.MSFT,onValuation:()=>opened++});
 const html=renderToStaticMarkup(tree);
 assert.equal((html.match(/role="tab"/g)||[]).length,2);
 assert.doesNotMatch(html,/>Conditional valuation<|>Historical price risk</);
 const visit=node=>{
  if(!React.isValidElement(node)) return;
  if(node.type==='button'&&node.props.className==='modelLink') node.props.onClick();
  React.Children.forEach(node.props.children,visit);
 };
 visit(tree); assert.equal(opened,1);
});
test('canonical Valuation retains the exact editable analyst-estimate P/E scenario tool',()=>{
 const s=fs.readFileSync('components/ValueStudio.tsx','utf8');
 assert.match(s,/<TargetsEstimates research=\{r\} initialView=\{2\} modelViewsOnly \/>/);
 const targets=fs.readFileSync('components/TargetsEstimates.tsx','utf8');
 assert.match(targets,/earningsMultiple: Number\(multipleValue\)/);
 assert.match(targets,/useState<number>\(initialView\)/);
});
test('Valuation model-only views preserve Exit P/E and full historical-risk presentation', async()=>{
 const {demoData}=await import('./fixtures/demo.ts');
 const targets=await import('../lib/targets-estimates.ts');
 const outlook=await import('../lib/outlook.ts');
 const PriceRiskCases=load('PriceRiskCases');
 const View=load('TargetsEstimates',{
  '@/lib/targets-estimates':targets,'@/lib/outlook':outlook,
  './PriceRiskCases':{__esModule:true,default:PriceRiskCases},
  ...Object.fromEntries(['AnalystTargets','EstimateRevisions','SelectedValuation'].map(name=>[`./${name}`,{__esModule:true,default:()=>null}]))
 });
 const research=demoData.research.MSFT;
 const model=targets.targetsEstimates(research);
 const earnings=renderToStaticMarkup(React.createElement(View,{research,initialView:2,modelViewsOnly:true}));
 assert.equal((earnings.match(/role="tab"/g)||[]).length,2);
 assert.match(earnings,/Exit P\/E assumption/);
 assert.doesNotMatch(earnings,/>Analyst targets<|>Annual estimates</);
 const risk=renderToStaticMarkup(React.createElement(View,{research,initialView:3,modelViewsOnly:true}));
 if(model.risk.available){
  assert.match(risk,/Historical price-risk cases/);
  assert.match(risk,/percentile/);
 }else assert.ok(risk.includes(model.risk.reason));
});
