import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function route(overrides={}) {
 const calls=[];
 class HttpError extends Error {constructor(message,status=400){super(message);this.status=status}}
 const deps={HttpError,account:async()=>({user:{id:'u'}}),limit:()=>{},privateJson:data=>({status:200,data}),failure:e=>({status:e.status??500}),requestAccess:async()=>({}),reserveAccess:async(_,__,___,s)=>{calls.push('access:'+s)},researchSymbol:s=>s.toUpperCase(),research:async s=>{calls.push('research:'+s);return {symbol:s}},projectResearch:r=>r,workspaceGuidance:(r,held)=>({symbol:r.symbol,held}),...overrides};
 const source=fs.readFileSync('app/api/pace-scan/route.ts','utf8').replace(/^import .*;\n/gm,'').replace('export async function GET','async function GET');
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 return {get:new Function(...Object.keys(deps),js+';return GET')(...Object.values(deps)),calls};
}
test('pace batches reject oversize requests without provider work',async()=>{const r=route();assert.equal((await r.get(new Request('https://test/api?symbols=A,B,C'))).status,400);assert.deepEqual(r.calls,[])});
test('pace checks each entitlement before research and returns entry and holding readings',async()=>{const r=route();const out=await r.get(new Request('https://test/api?symbols=A,B'));assert.equal(out.data.A.signal.held,true);assert.equal(out.data.A.entrySignal.held,false);for(const s of ['A','B'])assert(r.calls.indexOf('access:'+s)<r.calls.indexOf('research:'+s))});
test('a denied company cannot trigger provider work or erase a successful sibling',async()=>{const r=route({reserveAccess:async(_,__,___,s)=>{if(s==='A')throw Error('denied')}});const out=await r.get(new Request('https://test/api?symbols=A,B'));assert(out.data.A.error);assert(out.data.B.signal);assert(!r.calls.includes('research:A'))});
test('authentication failure prevents any provider work',async()=>{const r=route({account:async()=>{throw Object.assign(Error(),{status:401})}});assert.equal((await r.get(new Request('https://test/api?symbols=A'))).status,401);assert.deepEqual(r.calls,[])});
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
test('Pace board excludes blocked, pending and P1 readings from accumulation groups',()=>{
 const file='components/WorkspacePace.tsx', ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='PaceBoard');
 const code=ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 const PaceBoard=new Function('React','s','Link','PaceBadge','researchLink',code+';return PaceBoard')(React,{},({children,href})=>React.createElement('a',{href},children),()=>null,s=>'/research/'+s);
 const rows=Object.fromEntries([['ALLOW',4,true],['BLOCKED',4,false],['PENDING',null,true],['WATCH',1,true]].map(([symbol,rawLevel,permitted])=>[symbol,{signal:{view:{rawLevel,permitted}}}]));
 const html=renderToStaticMarkup(React.createElement(PaceBoard,{rows,loading:false,prefix:'',refresh:()=>{}}));
 assert.match(html,/href="\/research\/ALLOW"/); for(const symbol of ['BLOCKED','PENDING','WATCH'])assert(!html.includes('/research/'+symbol));
});
test('repeat scans reuse summary work but recheck access on every request',async()=>{const r=route();for(let i=0;i<2;i++)await r.get(new Request('https://test/api?symbols=A'));assert.equal(r.calls.filter(x=>x==='research:A').length,1);assert.equal(r.calls.filter(x=>x==='access:A').length,2)});
