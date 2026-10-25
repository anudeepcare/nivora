import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {createHash} from 'node:crypto';import {supportInput} from '../lib/support-input.ts';
class HttpError extends Error{constructor(message,status=400){super(message);this.status=status;}}
function handler({saved=true,delivered=false,ownerId='member'}={}){
 const ast=ts.createSourceFile('route.ts',fs.readFileSync('app/api/support/route.ts','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const body=ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast).replace(/^export /,'')).join('\n');
 const code=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const binding={createHash,supportInput,HttpError,privateJson:v=>Response.json(v),failure:e=>Response.json({error:e.message},{status:e.status??503}),accessDb:()=>({rpc:async()=>({error:saved?null:{message:'storage failed'}})}),account:async()=>({user:{id:ownerId}}),exactOwner:id=>id==='owner',deliverSupport:async()=>{if(!delivered)throw Error('mail failed');return{receipt:true};},retrySupport:async()=>[]};
 return new Function(...Object.keys(binding),code+';return {POST,GET,PATCH};')(...Object.values(binding));
}
const body={id:'00000000-0000-4000-8000-000000000001',category:'Feedback',email:'test@example.com',message:'The overview could use clearer labels.',page:'/contact'};
const request=(value=body,origin='https://example.test')=>new Request('https://example.test/api/support',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(value)});
test('contact success requires durable save; email failure retains the saved reference',async()=>{
 const old=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY='test-secret';
 try{const r=await handler().POST(request());assert.equal(r.status,200);assert.deepEqual(await r.json(),{saved:true,reference:body.id,receiptSent:false});const failed=await handler({saved:false}).POST(request());assert.equal(failed.status,503);assert.equal((await failed.json()).saved,undefined);}finally{if(old===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=old;}
});
test('contact rejects external origins and invalid messages before save',async()=>{assert.equal((await handler().POST(request(body,'https://evil.test'))).status,403);assert.equal((await handler().POST(request({...body,message:'x'}))).status,400);});
test('support inbox cannot be opened by a regular account',async()=>assert.equal((await handler().GET(new Request('https://example.test/api/support'))).status,403));
