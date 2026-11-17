import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as atlas from '../lib/reference-atlas.ts';
import * as format from '../lib/format.ts';
import {demoData} from './fixtures/demo.ts';
test('unavailable Atlas uses one status region with all evidence visible, not unequal outcome columns',()=>{
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('components/ReferenceAtlas.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>{
 if(name==='react')return React;if(name==='react/jsx-runtime')return jsx;
 if(name==='@/lib/reference-atlas')return atlas;if(name==='@/lib/format')return format;
 if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};throw Error(name);
 },mod,mod.exports);
 const base=demoData.research.MSFT;
 const research={...base,history:[],facts:[],filings:[],evidence:undefined,snapshot:undefined,quote:{...base.quote,price:null,asOf:null,stale:true}};
 const model=atlas.referenceAtlas(research);assert.equal(model.cases.length,0);
 const html=renderToStaticMarkup(React.createElement(mod.exports.default,{research,onTab:()=>{}}));
 assert.match(html,/aria-label="Model availability and evidence"/);
 assert.doesNotMatch(html,/class="lower"/);
 for(const check of model.brief.checks) assert.ok(html.includes(check.label));
 assert.match(html,/class="checkGrid"/);
 assert.doesNotMatch(html,/NaN|Infinity/);
});
