import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
test('disabled publication returns a deliberate empty state without database access',async()=>{
 const source=ts.transpileModule(fs.readFileSync('app/api/pace-record/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};const old=process.env.AURYN_EXTERNAL_DATA_LICENSED;process.env.AURYN_EXTERNAL_DATA_LICENSED='false';
 try{new Function('require','module','exports',source)(n=>n==='@supabase/supabase-js'?{createClient:()=>{throw Error('must not access DB')}}:n.endsWith('/server')?{failure:e=>{throw e}}:{},m,m.exports);const r=await m.exports.GET();assert.equal(r.status,200);assert.deepEqual(await r.json(),{records:[],status:'publication-disabled'});}finally{if(old===undefined)delete process.env.AURYN_EXTERNAL_DATA_LICENSED;else process.env.AURYN_EXTERNAL_DATA_LICENSED=old;}
});
