import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as icons from 'lucide-react';
import * as format from '../lib/format.ts';
const code=ts.transpileModule(fs.readFileSync('components/ResearchBrief.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
function views({target=true,rsi=76}={}) {
 const mod={exports:{}};
 const dependencies={react:React,'react/jsx-runtime':jsx,'lucide-react':icons,'@/lib/format':format,'@/lib/analysis':{indicators:()=>({rsi,ma200:110}),latestFinancialEvidence:()=>({latest:{end:'2026-09-30'},periodBasis:'TTM'})},'@/lib/outlook':{consensusOutlook:()=>target?{target:120,referencePrice:100}:null},'@/lib/movement-context':{movementContext:()=>({change:null})},'@/lib/auryn-decision':{aurynDecision:(_,options)=>({actionLabel:options.ownsPosition?'Hold':'Watch',pace:{level:1},reference:{price:100,currency:'USD',asOf:'2026-11-06',basis:'settled-close'}})},'./ResearchBrief.module.css':{__esModule:true,default:{}}};
 new Function('require','module','exports',code)(name=>{if(!(name in dependencies))throw Error(name);return dependencies[name]},mod,mod.exports);return mod.exports;
}
const research={retrievedAt:'2026-11-08T12:00:00Z',history:[],quote:{price:999,currency:'USD'},company:{symbol:'TEST'}};
test('brief uses the selected reference denominator and the holding decision',()=>{
 const {OverviewBrief}=views();const html=renderToStaticMarkup(React.createElement(OverviewBrief,{research,now:Date.parse(research.retrievedAt),owns:true}));
 assert.match(html,/Hold · Zone P1/);assert.match(html,/\+20\.0% to the \$120\.00 analyst target/);assert.doesNotMatch(html,/16\.7%|999|NaN/);
});
test('brief omits absent targets and momentum instead of fabricating values',()=>{
 const {OverviewBrief}=views({target:false,rsi:null});const html=renderToStaticMarkup(React.createElement(OverviewBrief,{research,now:Date.parse(research.retrievedAt)}));
 assert.match(html,/Watch · Zone P1/);assert.doesNotMatch(html,/analyst target|RSI|NaN|Infinity/);
});
test('freshness distinguishes missing datasets from the report period',()=>{
 const {DataFreshness}=views();const html=renderToStaticMarkup(React.createElement(DataFreshness,{research,now:Date.parse(research.retrievedAt),wide:true}));
 assert.equal((html.match(/Not supplied/g)||[]).length,2);assert.match(html,/Sep 30, 2026 · TTM/);assert.match(html,/Nov 6, 2026 · Completed close/);assert.doesNotMatch(html,/Nov 8, 2026 · (TTM|Completed close)/);
});
