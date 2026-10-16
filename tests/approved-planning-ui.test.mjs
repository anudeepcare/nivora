import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(file){assert.ok(fs.existsSync(file),'PlanningWorkbench is renderable');const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('module','exports','require',code)(module,module.exports,name=>{if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?path.resolve(name.slice(2)):path.resolve(path.dirname(file),name);return load(fs.existsSync(base+'.tsx')?base+'.tsx':base+'.ts');}return require(name);});return module.exports;}
const render=(props={})=>renderToStaticMarkup(React.createElement(load('components/PlanningWorkbench.tsx').default,props));
test('planning controls explain 1x, experimental caps, personal evidence and preview boundary',()=>{const html=render({symbol:'AAPL'});for(const text of ['1x','planned contribution','Research proposal','No order','Personal evidence','Cadence','Review date','Pause conditions'])assert.ok(html.includes(text),text);assert.match(html,/Cash available/);assert.match(html,/memory only/);});
test('workbench shows reconciled before/after cash and current source-backed evidence',()=>{const html=render({symbol:'AAPL',price:10,cash:300,totalValue:1000,positionValue:100,evidence:{snapshotId:'snapshot-a',knownAt:'2026-01-01',thesis:'intact',valuation:'supported',fundingRisk:'normal',evidenceReady:true,tacticalSetup:'weak',references:['filing-1']}});assert.match(html,/snapshot-a/);assert.match(html,/filing-1/);assert.match(html,/Before/);assert.match(html,/After/);assert.match(html,/\$200\.00/);assert.match(html,/\$300\.00/);});
test('replay starts unavailable and journal makes local persistence limits explicit',()=>{const html=render({symbol:'AAPL',storageScope:'owner-123'});assert.match(html,/No historical dataset loaded/);assert.match(html,/Local-only/);assert.match(html,/immutable/);assert.match(html,/Process quality/);assert.doesNotMatch(html,/Guaranteed|Paper order submitted/);});

test('accumulation overview shows preview status without fabricating historical signals',()=>{const html=render({symbol:'IREN'});assert.match(html,/Accumulation at a glance/);assert.match(html,/Paused/);assert.match(html,/No saved decision/);assert.match(html,/Allocation history/);assert.match(html,/not reconstructed historical signals/);assert.doesNotMatch(html,/Strong Buy Zone|3X DCA/);});
