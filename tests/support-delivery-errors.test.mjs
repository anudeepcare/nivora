import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
import {supportDeliveryStatus,supportDeliveryError} from '../lib/support-status.ts';
function harness(status){
 const ast=ts.createSourceFile('delivery.ts',fs.readFileSync('lib/support-delivery.ts','utf8'),ts.ScriptTarget.Latest,true);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='deliverSupport');
 const code=ts.transpileModule(fn.getText(ast).replace('export ',''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const calls=[],updates=[];const row={email:'person@example.invalid',category:'Question',page:'/contact',message:'Example',attempts:0};
 const db={from:()=>({select:()=>({eq:()=>({single:async()=>({data:row})})}),update:v=>({eq:async()=>{updates.push(v);return {error:null}}})})};
 const env={AURYN_SUPPORT_EMAIL_ENABLED:'true',RESEND_API_KEY:'secret',AURYN_SUPPORT_FROM:'support@auryninvest.com',VERCEL_ENV:'production'};
 const fnc=new Function('process','SUPPORT_EMAIL','accessDb','fetch','supportDeliveryStatus','supportDeliveryError','console',code+';return deliverSupport;')({env},'support@auryninvest.com',()=>db,async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:status===200,status,json:async()=>({message:'You can only send testing emails to your own email address (private@example.invalid)'})}},supportDeliveryStatus,supportDeliveryError,{error:()=>{}});
 return {run:()=>fnc('example-reference'),calls,updates};
}
test('provider rejection is actionable and never sends a customer receipt or marks delivery successful',async()=>{
 const h=harness(403);await assert.rejects(h.run(),/Verify auryninvest.com/);assert.equal(h.calls.length,1);assert.ok(!h.updates.some(x=>x.owner_notified_at||x.receipt_sent_at));
});
test('accepted support notification uses support inbox and receipt uses submitting address',async()=>{
 const h=harness(200);assert.deepEqual(await h.run(),{notified:true,receipt:true});assert.deepEqual(h.calls.map(x=>x.to),[['support@auryninvest.com'],['person@example.invalid']]);
});
