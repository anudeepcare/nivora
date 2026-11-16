import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
const code=ts.transpileModule(fs.readFileSync('components/OptionsAggregatePanel.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
const mod={exports:{}};
new Function('require','module','exports',code)(name=>{
 if(name==='react')return React;
 if(name==='react/jsx-runtime')return jsx;
 if(name==='@/lib/client')return {api:()=>{throw Error('not called during render')}};
 if(name.endsWith('.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
 throw Error(name);
},mod,mod.exports);
const render=result=>renderToStaticMarkup(React.createElement(mod.exports.OptionsAggregateView,{symbol:'NBIS',result}));
test('aggregate view labels dates, formats fractions, distinguishes absence from zero',()=>{
 const html=render({status:'ok',snapshot:{asOf:'2026-11-13',metrics:{atmIv:0.65,callVol:0,pcVol:0.75,expectedMove1d:0.031}}});
 assert.match(html,/65.0%/);assert.match(html,/3.1%/);assert.match(html,/0.75/);assert.match(html,/<dd>0<\/dd>/);assert.match(html,/Not available/);assert.match(html,/2026-11-13/);assert.match(html,/not a live contract chain or trade tape/);
});
test('empty and loading views never invent a snapshot',()=>{assert.match(render(null),/Loading options snapshot/);const html=render({status:'unavailable',message:'No coverage'});assert.match(html,/No coverage/);assert.doesNotMatch(html,/<dd>/)});
test('options desk switches only on explicit aggregate-only marker',()=>{const text=fs.readFileSync('components/OptionsDesk.tsx','utf8');assert.match(text,/chain\.coverage === "aggregate-only"/);assert.match(text,/<OptionsAggregatePanel symbol=\{research.company.symbol\}/)});
