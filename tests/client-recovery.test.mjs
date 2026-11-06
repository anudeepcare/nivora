import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function setup(statuses){
 let requests=0,refreshes=0;
 const exports={};
 const auth={getSession:async()=>({data:{session:{access_token:'old'}}}),refreshSession:async()=>{refreshes++;await new Promise(r=>setTimeout(r,5));return {data:{session:{access_token:'new'}}}}};
 const code=ts.transpileModule(fs.readFileSync('lib/client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const context={exports,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.test',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'test'}},require:(name)=>name.includes('request-deadline')?{fetchWithDeadline:(url,options)=>context.fetch(url,options)}:name==='@supabase/ssr'?{createBrowserClient:()=>({auth})}:name.includes('customer-language')?{customerText:x=>x}:{},fetch:async(url,options)=>{requests++;const status=statuses(options.headers.Authorization);return {status,ok:status===200,json:async()=>status===200?{ok:true}:{error:'Unavailable'}}}};
 vm.runInNewContext(code,context);
 return {api:exports.api,counts:()=>({requests,refreshes})};
}
test('concurrent expired-token requests share one refresh and retry with the new token',async()=>{
 const x=setup(token=>token==='Bearer old'?401:200);
 const result=await Promise.all([x.api('workspace'),x.api('access')]);
 assert.ok(result.every(r=>r.ok));assert.deepEqual(x.counts(),{requests:4,refreshes:1});
});
test('authorization retry is bounded when refreshed credentials are also rejected',async()=>{
 const x=setup(()=>401);await assert.rejects(x.api('workspace'),e=>e.status===401);assert.deepEqual(x.counts(),{requests:2,refreshes:1});
});
test('non-auth failures are not retried, including mutations',async()=>{
 const x=setup(()=>503);await assert.rejects(x.api('workspace',{action:'save'}),e=>e.status===503);assert.deepEqual(x.counts(),{requests:1,refreshes:0});
});
