import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const load=(file,cache=new Map())=>{const full=path.resolve(file);assert.ok(fs.existsSync(full),'Weekly structure component and calculation modules must exist');if(cache.has(full))return cache.get(full).exports;const mod={exports:{}};cache.set(full,mod);const js=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(id=>{if(id==='lightweight-charts'||id.endsWith('.css'))return {};if(id.startsWith('@/')||id.startsWith('.')){const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(full),id);return load([base,base+'.ts',base+'.tsx'].find(x=>fs.existsSync(x)&&fs.statSync(x).isFile()),cache);}return require(id);},mod,mod.exports);return mod.exports;};
const {GlassEvents,GlassOwnership}=load('components/research/GlassEvidencePages.tsx');
test('absent events and ownership data do not create empty metric tables',()=>{
 const events=renderToStaticMarkup(React.createElement(GlassEvents,{symbol:'TEST',context:{},company:{},assessment:{}}));
 assert.doesNotMatch(events,/Last reported quarter|EPS estimate|Revenue estimate/);
 const ownership=renderToStaticMarkup(React.createElement(GlassOwnership,{data:{enabled:false}}));
 assert.doesNotMatch(ownership,/Managers adding|Managers trimming|<table/);
});
test('events prioritize operating filings over repeated insider filings',()=>{
 const filings=[...Array.from({length:12},(_,i)=>({form:'4',date:'2026-10-15',label:'Insider transaction',accession:String(i)})),{form:'10-Q',date:'2026-10-01',label:'Quarterly report',accession:'quarter'}];
 const html=renderToStaticMarkup(React.createElement(GlassEvents,{symbol:'TEST',context:{},company:{filings},assessment:{}}));
 assert.match(html,/Quarterly report/);assert.doesNotMatch(html,/Insider transaction/);
});
