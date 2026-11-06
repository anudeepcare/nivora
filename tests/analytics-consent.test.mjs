import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import React from 'react';
import {analyticsPath,safeAnalyticsEvent,validMeasurementId} from '../lib/analytics-policy.ts';
function harness(id='G-TEST123'){
 let cursor=0,dirty=true,path='/',tree;const slots=[],effects=[],pending=[],scripts=[],listeners=new Map(),stored=new Map();
 const w={addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:(n,f)=>{if(listeners.get(n)===f)listeners.delete(n);}};
 const doc={cookie:'',head:{appendChild:s=>scripts.push(s)},createElement:()=>({}),addEventListener:()=>{},removeEventListener:()=>{}};
 const ast=ts.createSourceFile('AnalyticsConsent.tsx',fs.readFileSync('components/AnalyticsConsent.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const source=ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export default /,'').replace(/^export /,'')).join('\n');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const bindings={React,analyticsPath,safeAnalyticsEvent,validMeasurementId,SITE_URL:'https://www.auryninvest.com',process:{env:{NEXT_PUBLIC_GA_MEASUREMENT_ID:id}},window:w,document:doc,location:{hostname:'www.auryninvest.com'},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},Link:()=>null,PerformanceObserver:undefined,
 usePathname:()=>path,useRef:v=>{const i=cursor++;return slots[i]??=( {current:v});},
 useState:v=>{const i=cursor++;if(!(i in slots))slots[i]=v;return[slots[i],n=>{const value=typeof n==='function'?n(slots[i]):n;if(value!==slots[i]){slots[i]=value;dirty=true;}}];},
 useEffect:(fn,deps)=>{const i=cursor++;const old=effects[i];if(!old||deps.some((d,j)=>!Object.is(d,old.deps[j]))){pending.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});}}
 };
 const View=new Function(...Object.keys(bindings),code+';return AnalyticsConsent;')(...Object.values(bindings));
 const render=()=>{for(let i=0;i<10&&dirty;i++){dirty=false;cursor=0;tree=View();while(pending.length)pending.shift()();}return tree;};
 function find(node,text){if(!node)return null;if(Array.isArray(node)){for(const n of node){const v=find(n,text);if(v)return v;}return null;}if(node.type==='button'&&node.props.children===text)return node;return find(node.props?.children,text);}
 return {render,scripts,w,doc,events:()=> (w.dataLayer||[]).map(a=>[...a]).filter(a=>a[0]==='event'),choose:text=>{const n=find(render(),text);assert.ok(n,text+' exists');n.props.onClick();render();},navigate:p=>{path=p;dirty=true;render();},load:()=>{scripts[0].onload();render();},emit:(name,params)=>listeners.get('auryn:analytics')?.({detail:{name,params}}),open:()=>{listeners.get('auryn:privacy')();render();}};
}
test('optional analytics loads only after consent, tracks one coarse page per transition and stops on revoke',()=>{
 const h=harness();h.render();assert.equal(h.scripts.length,0);h.choose('Decline');assert.equal(h.scripts.length,0);
 h.open();h.choose('Allow analytics');assert.equal(h.scripts.length,1);h.load();assert.equal(h.events().filter(e=>e[1]==='page_view').length,1);
 h.navigate('/research/PRIVATE?email=secret');h.navigate('/research/OTHER');assert.equal(h.events().filter(e=>e[1]==='page_view').length,2);
 h.emit('search_result',{outcome:'success',duration:500,query:'PRIVATE',email:'secret'});
 const last=h.events().at(-1);assert.equal(last[2].duration_bucket,'300ms–1s');assert.doesNotMatch(JSON.stringify(h.events()),/PRIVATE|OTHER|secret|email|query/);
 h.open();h.choose('Decline');const before=h.events().length;h.emit('search_select',{});h.navigate('/pricing');assert.equal(h.events().length,before);assert.equal(h.w['ga-disable-G-TEST123'],true);
});
test('unconfigured and preview analytics never load a remote script',()=>{
 const h=harness('');h.render();h.open();h.choose('Allow analytics');assert.equal(h.scripts.length,0);
 const p=harness();p.navigate('/preview/research/MSFT');p.open();assert.equal(p.render(),null);assert.equal(p.scripts.length,0);
});
