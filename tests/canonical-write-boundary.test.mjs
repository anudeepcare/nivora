import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness(authorized) {
  const writes=[];
  const generated={state:'RESEARCH_READY',decision:{snapshotId:'server',newMoneyAction:'WAIT'},marketTruth:{decisionPrice:42}};
  const client={from:()=>({insert:async row=>{writes.push(row);return {error:null};}})};
  const imports={
    'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}},
    '@supabase/supabase-js':{createClient:()=>client},
    '@/lib/nivora-version':{},'@/lib/nivora-snapshot':{},
    '@/lib/server/authorization':{authorizeRequest:async()=>authorized?{user:{id:'verified'}}:{response:Response.json({error:'Unauthorized'},{status:401})}},
    '@/lib/rate-limit':{rateLimitDistributed:async()=>({ok:true})},
    '@/lib/auryn/v995/autonomous-research':{runAutonomousCanonicalResearch:async()=>generated},
    '@/lib/auryn/v995/persist-research':{persistAutonomousResearch:async(db,symbol,result)=>{writes.push({symbol,result});return {canonicalSnapshotId:'saved-server'};}},
  };
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/validation/snapshot/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports,require:name=>{if(!(name in imports))throw Error(name);return imports[name]},process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture'}},Response,Request,URL,Date,console});
  return {POST:exports.POST,writes,generated};
}
const request=(symbol='AAPL')=>new Request('https://example.invalid/api/validation/snapshot',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({symbol,price:100,evidence:{v931:{newMoneyAction:'STRONG_BUY'}}})});
test('an unauthenticated client cannot poison shared canonical research',async()=>{
  const h=harness(false),response=await h.POST(request());
  assert.equal(response.status,401);assert.equal(h.writes.length,0);
});
test('an authenticated refresh persists only freshly calculated server evidence',async()=>{
  const h=harness(true),response=await h.POST(request());
  assert.equal(response.status,200);assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].result,h.generated);
  assert.equal((await response.json()).snapshotId,'saved-server');
});
test('malformed symbols cannot reach the canonical persistence boundary',async()=>{
  const h=harness(true),response=await h.POST(request('../private'));
  assert.equal(response.status,400);assert.equal(h.writes.length,0);
});
