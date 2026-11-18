import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as atlas from '../lib/reference-atlas.ts';
import * as format from '../lib/format.ts';
import { demoData } from './fixtures/demo.ts';
function load(react=React){
 const code=ts.transpileModule(fs.readFileSync('components/ReferenceAtlas.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const mod={exports:{}};
 return import('react/jsx-runtime').then(jsx=>{
  new Function('require','module','exports',code)(name=>{
   if(name==='react')return react;
   if(name==='react/jsx-runtime')return jsx;
   if(name==='@/lib/reference-atlas')return atlas;
   if(name==='@/lib/format')return format;
      if (name === "./PaceMonthHistory") return {__esModule:true,default:()=>React.createElement("section",{"data-pace-month-history":true})};
   if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
   throw Error(name);
  },mod,mod.exports);
  return mod.exports.default;
 });
}
const all=(tree,predicate)=>{if(!tree||typeof tree!=='object')return [];return [...(predicate(tree)?[tree]:[]),...React.Children.toArray(tree.props?.children).flatMap(child=>all(child,predicate))];};
test('real Atlas markup includes all accessible controls and no nonfinite values',async()=>{
 const Atlas=await load();
 const html=renderToStaticMarkup(React.createElement(Atlas,{research:demoData.research.MSFT,onTab:()=>{}}));
 assert.match(html,/Decision Atlas/);assert.match(html,/Evidence map · not a synthetic score/);
 assert.equal((html.match(/aria-pressed=/g)||[]).length,6);
 assert.doesNotMatch(html,/NaN|Infinity|undefined/);
 assert.match(html,/Open Pace evidence/);
});
test('orbit selection changes real selected evidence and routes the action correctly',async()=>{
 let selected=0;const routes=[];
 const Atlas=await load({...React,useMemo:fn=>fn(),useId:()=> 'atlas-test',useState:()=>[selected,v=>{selected=v;}]});
 const render=()=>Atlas({research:demoData.research.MSFT,onTab:x=>routes.push(x)});
 let tree=render();
 const buttons=all(tree,node=>node.type==='button'&&node.props['aria-pressed']!==undefined);
 assert.equal(buttons.length,6);buttons[4].props.onClick();
 tree=render();const active=all(tree,node=>node.type==='button'&&node.props['aria-pressed']===true);
 assert.match(active[0].props['aria-label'],/^Ownership:/);
 const detail=all(tree,node=>node.type==='button'&&node.props.children?.[0]==='Explore ');
 assert.equal(detail.length,1);detail[0].props.onClick();assert.deepEqual(routes,['Thesis']);
});
