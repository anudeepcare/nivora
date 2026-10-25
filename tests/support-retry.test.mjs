import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
function retryHarness(){
 const rows=[{id:'a',attempts:5},{id:'b',attempts:6},{id:'c',attempts:0}];
 const ast=ts.createSourceFile('support-delivery.ts',fs.readFileSync('lib/support-delivery.ts','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='retrySupport');const code=ts.transpileModule(fn.getText(ast).replace('export ',''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const delivered=[];const db={from(){let values=[...rows];const q={select(){return q},is(){return q},lt(_k,n){values=values.filter(v=>v.attempts<n);return q},order(){return q},limit(n){values=values.slice(0,n);return q},then(resolve){resolve({data:values,error:null})}};return q;}};
 const retry=new Function('accessDb','deliverSupport',code+';return retrySupport;')(()=>db,async id=>{delivered.push(id);return {notified:true,receipt:true}});return{retry,delivered};
}
test('manual owner retries recover notifications after the automatic attempt limit',async()=>{const h=retryHarness();await h.retry(true);assert.deepEqual(h.delivered,['a','b']);});
test('automatic retry stays bounded and leaves exhausted notifications for owner review',async()=>{const h=retryHarness();await h.retry();assert.deepEqual(h.delivered,['c']);});
