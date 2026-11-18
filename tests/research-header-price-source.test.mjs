import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
const source=fs.readFileSync('components/Research.tsx','utf8');
const ast=ts.createSourceFile('Research.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let node;
function visit(n){if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(ast)==='DataStamp'&&n.getText(ast).includes('headerReference'))node=n;ts.forEachChild(n,visit);}
visit(ast);
const code=ts.transpileModule('const stamp='+node.getText(ast)+';',{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
const stamp=(r,headerReference)=>new Function('React','DataStamp','r','headerReference',code+';return stamp;')(React,()=>null,r,headerReference).props;
test('settled header identifies history source and original date, never quotes provenance',()=>{
 const r={historySource:'historical-provider',quote:{source:'quote-fallback',asOf:'2026-11-17T22:30:00Z',session:'After hours'}};
 const ref={basis:'settled-close',asOf:'2026-11-17'};
 assert.equal(stamp(r,ref).source,'historical-provider');
 assert.equal(stamp(r,ref).asOf,'2026-11-17');
 assert.equal(stamp(r,ref).status,'Latest close');
 assert.equal(stamp({...r,historySource:undefined},ref).source,undefined);
});
test('quote header retains supplied quote source/session and full observation timestamp',()=>{
 const r={historySource:'historical-provider',quote:{source:'quote-provider',asOf:'2026-11-17T22:30:00Z',session:'After hours'}};
 const result=stamp(r,{basis:'quote',asOf:r.quote.asOf});
 assert.equal(result.source,'quote-provider');
 assert.equal(result.asOf,r.quote.asOf);
 assert.equal(result.status,'After hours');
});
