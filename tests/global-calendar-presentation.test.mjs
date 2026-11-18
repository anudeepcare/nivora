import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as calendar from '../lib/global-earnings.ts';
const day=calendar.earningsWindow(7).from;
let data={windowStart:day,windowEnd:day,retrievedAt:day+'T12:00:00Z',generatedAt:day+'T10:00:00Z',preview:false,totalCount:1,omitted:0,events:[{ticker:'ABC',company:'Example',date:day,reported:false,confirmed:true,session:'before_open',quarter:'Q1',eps:1.25,revenue:2500000,callTime:null,webcast:null}]};
const source=ts.transpileModule(fs.readFileSync('components/GlobalEarningsCalendar.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
const mod={exports:{}};
const deps={'react':React,'react/jsx-runtime':jsx,'next/link':({children,...p})=>React.createElement('a',p,children),'next/dynamic':()=>()=>null,'./Session':{useResource:()=>({data,loading:false,error:null,refresh(){}})},'@/lib/global-earnings':calendar,'./GlobalEarningsCalendar.module.css':{default:new Proxy({},{get:(_,k)=>String(k)}),__esModule:true}};
new Function('require','module','exports',source)(name=>{assert.ok(name in deps,name);return deps[name]},mod,mod.exports);
const render=()=>renderToStaticMarkup(React.createElement(mod.exports.default));
test('calendar keeps long basis and freshness notes in closed native disclosure',()=>{
 const html=render();
 assert.match(html,/<details[^>]*>[\s\S]*?<summary[^>]*>Data &amp; coverage<\/summary>/);
 assert.doesNotMatch(html,/<details[^>]*\sopen/);
 assert.match(html,/currency and accounting basis/);
 assert.match(html,/cached for 24 hours/);
 assert.match(html,/Loaded reports/);
});
test('calendar highlights real numeric values without adding currency or positive sentiment',()=>{
 const html=render();
 assert.match(html,/class="[^"]*metricValue[^"]*"[^>]*>1.25</);
 assert.match(html,/class="[^"]*metricValue[^"]*"[^>]*>2.5M</);
 assert.doesNotMatch(html,/\$1.25|\$2.5M/);
});
test('preview limitation remains visible outside collapsed details',()=>{
 data={...data,preview:true};const html=render();
 assert.match(html,/<p class="notice"[^>]*>Limited provider preview/);
});
