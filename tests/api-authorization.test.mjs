import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, imports, env) {
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={}; vm.runInNewContext(source,{exports,require:name=>{if(!(name in imports))throw Error(`Unexpected import ${name}`);return imports[name]},process:{env},Request,Response,URL,AbortSignal,Date,console});return exports;
}
function harness(user=null,extra={}) {
 const env={NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test',CRON_SECRET:'test-cron',...extra};
 const client={auth:{getUser:async()=>({data:{user},error:null})},from:()=>{throw Error('Unauthorized database access')} };
 const imports={'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}},'@supabase/supabase-js':{createClient:()=>client},'@/lib/auryn/market-data-gateway':{},'@/lib/nivora-trading-metrics':{},'@/lib/nivora-version':{},'@/lib/nivora-market-session':{},'@/lib/alpaca-paper':{},'@/lib/auryn/v995/persist-research':{},'@/lib/server/paper-operations':{}};
 if(fs.existsSync('lib/server/authorization.ts'))imports['@/lib/server/authorization']=load('lib/server/authorization.ts',imports,env);
 return {loadRoute:path=>load(`app/api/${path}/route.ts`,imports,env),imports,client};
}
for(const [path,method] of [['portfolio/pulse','GET'],['portfolio/pulse','POST'],['trading-lab/status','GET'],['trading-lab/run-now','POST'],['trading-lab/control','POST'],['trading-lab/reconcile','POST']]) {
 test(`${method} ${path} rejects forged user id without bearer`,async()=>{
  const h=harness();const response=await h.loadRoute(path)[method](new Request('https://example.invalid/api/'+path,{method,headers:{'x-nivora-user-id':'victim'}}));assert.equal(response.status,401);
 });
}
for(const path of ['trading-lab/status','trading-lab/run-now','trading-lab/control','trading-lab/reconcile'])test(`${path} rejects ordinary user even with editable admin metadata`,async()=>{
 const h=harness({id:'regular',user_metadata:{role:'admin'}});const method=path.endsWith('status')?'GET':'POST';
 const response=await h.loadRoute(path)[method](new Request('https://example.invalid/api/'+path,{method,headers:{authorization:'Bearer valid'}}));assert.equal(response.status,403);
});
test('verified identity is used; invalid tokens fail closed; only trusted admin roles and explicit ids qualify',async()=>{
 const h=harness({id:'verified',app_metadata:{role:'admin'}});const auth=h.imports['@/lib/server/authorization'];assert.ok(auth);
 const req=new Request('https://example.invalid',{headers:{authorization:'Bearer valid','x-nivora-user-id':'victim'}});
 const result=await auth.authorizeRequest(req,true);assert.equal(result.user.id,'verified');
 assert.equal((await harness(null).imports['@/lib/server/authorization'].authorizeRequest(req)).response.status,401);
 assert.equal((await harness({id:'allowed'},{AURYN_ADMIN_USER_IDS:' someone, allowed '}).imports['@/lib/server/authorization'].authorizeRequest(req,true)).user.id,'allowed');
 assert.equal((await harness({id:'denied'},{AURYN_ADMIN_USER_IDS:'allowed'}).imports['@/lib/server/authorization'].authorizeRequest(req,true)).response.status,403);
});

test('pulse read and write bind database ownership to verified identity, ignoring forged header',async()=>{
 const h=harness({id:'verified'});const observed=[];
 const query={select(){return this},eq(key,value){observed.push([key,value]);return this},order(){return this},limit:async()=>({data:[],error:null}),upsert:async row=>{observed.push(['user_id',row.user_id]);return {error:null}}};
 h.client.from=()=>query;
 h.imports['@/lib/auryn/market-data-gateway'].loadCanonicalMarketSnapshots=async()=>new Map();
 for(const method of ['GET','POST']){
  const req=new Request('https://example.invalid/api/portfolio/pulse',{method,headers:{authorization:'Bearer valid','x-nivora-user-id':'victim','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify({totalValue:123})}:{})});
  assert.equal((await h.loadRoute('portfolio/pulse')[method](req)).status,200);
 }
 assert.deepEqual(observed,[['user_id','verified'],['user_id','verified']]);
});

test('pulse rejects null, empty and nonnumeric balance instead of coercing to zero',async()=>{
 const h=harness({id:'verified'});
 for(const totalValue of [null,'', '123', -1]){
  const r=await h.loadRoute('portfolio/pulse').POST(new Request('https://example.invalid/api/portfolio/pulse',{method:'POST',headers:{authorization:'Bearer valid','content-type':'application/json'},body:JSON.stringify({totalValue})}));
  assert.equal(r.status,400);
 }
});
