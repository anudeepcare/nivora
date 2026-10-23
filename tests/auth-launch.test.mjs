import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const policy=()=>import('../lib/auth-navigation.ts');
test('auth routes canonicalize login and sign-out without replacing authenticated deep links',async()=>{
 const {authDestination}=await policy();
 assert.equal(authDestination('/portfolio',false),'/login');
 assert.equal(authDestination('/research/APP',false),'/login');
 assert.equal(authDestination('/login',true),'/overview');
 assert.equal(authDestination('/research/APP',true),null);
 assert.equal(authDestination('/reset-password',true),null);
 assert.equal(authDestination('/reset-password',false),'/login');
 assert.equal(authDestination('/login',true,true),'/reset-password');
 assert.equal(authDestination('/settings',true,true),'/reset-password');
});
test('OAuth callback accepts only fixed internal destinations and never trusts forwarded hosts',async()=>{
 const {completeAuthCallback}=await import('../lib/auth-callback.ts');let calls=0;
 const exchange=async code=>{calls++;assert.equal(code,'one-time-code');return {error:null}};
 for(const next of ['https://evil.test','//evil.test','/\\evil.test','%2f%2fevil.test','/portfolio']){
 const r=await completeAuthCallback('https://auryninvest.com/auth/callback?code=one-time-code&next='+encodeURIComponent(next),exchange);
 assert.equal(r,'/overview');}
 assert.equal(await completeAuthCallback('https://auryninvest.com/auth/callback?code=one-time-code&next=/reset-password',exchange),'/reset-password');
 assert.equal(calls,6);
 assert.equal(await completeAuthCallback('https://auryninvest.com/auth/callback?error=access_denied',exchange),'/login?auth_error=cancelled');
 assert.equal(calls,6);
 assert.equal(await completeAuthCallback('https://auryninvest.com/auth/callback?code=one-time-code',async()=>({error:{message:'private detail'}})),'/login?auth_error=callback');
 assert.equal(await completeAuthCallback('https://auryninvest.com/auth/callback',exchange),'/login?auth_error=callback');
});
test('logout waits for successful revocation before clearing memory and replacing the location',async()=>{
 const {completeSignOut}=await import('../lib/auth-actions.ts');const calls=[];
 await assert.rejects(()=>completeSignOut(async()=>({error:new Error('offline')}),()=>calls.push('clear'),()=>calls.push('redirect')),/offline/);assert.deepEqual(calls,[]);
 await completeSignOut(async()=>({error:null}),()=>calls.push('clear'),path=>calls.push(path));assert.deepEqual(calls,['clear','/login']);
});
test('email confirmation and recovery accept only explicit token types and fixed destinations',async()=>{
 const {completeEmailConfirmation}=await import('../lib/auth-callback.ts');const calls=[];
 const verify=async value=>{calls.push(value);return {error:null}};
 assert.equal(await completeEmailConfirmation('https://auryninvest.com/auth/confirm?token_hash=one-time-hash&type=email&next=//evil.test',verify),'/overview');
 assert.deepEqual(calls[0],{token_hash:'one-time-hash',type:'email'});
 assert.equal(await completeEmailConfirmation('https://auryninvest.com/auth/confirm?token_hash=one-time-hash&type=recovery',verify),'/reset-password');
 for(const query of ['type=email','token_hash=x&type=magiclink','token_hash=x&type=invite','token_hash=x&type=bogus'])assert.equal(await completeEmailConfirmation('https://auryninvest.com/auth/confirm?'+query,verify),'/login?auth_error=callback');
 assert.equal(calls.length,2);
 assert.equal(await completeEmailConfirmation('https://auryninvest.com/auth/confirm?token_hash=x&type=email',async()=>({error:'expired'})),'/login?auth_error=callback');
});
test('real session boundary ignores an initial session response arriving after sign-out',async()=>{
 const ts=(await import('typescript')).default,React=(await import('react')).default;
 const source=fs.readFileSync('components/Session.tsx','utf8'),ast=ts.createSourceFile('Session.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const declaration=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ProductSession');
 const js=ts.transpileModule(declaration.getText(ast).replace('export ',''),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 let settle,listener,index=0,ei=0;const states=[],effects=[],deps=[],routes=[],router={replace:path=>routes.push(path)};
 const useState=initial=>{const i=index++;if(!(i in states))states[i]=initial;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v}]};
 const useEffect=(fn,values)=>{const i=ei++;if(!deps[i]||values.some((v,j)=>v!==deps[i][j])){deps[i]=values;effects.push(fn)}};
 const {authDestination}=await policy();
 const bindings={usePathname:()=>'/portfolio',useRouter:()=>router,useState,useEffect,authClient:()=>({auth:{getSession:()=>new Promise(resolve=>{settle=resolve}),onAuthStateChange:fn=>{listener=fn;return {data:{subscription:{unsubscribe(){}}}}}}}),clearAccountCache:()=>{},authDestination,Logo:'Logo',Login:'Login',StoreProvider:'StoreProvider'};
 const Boundary=new Function('React',...Object.keys(bindings),js+';return ProductSession')(React,...Object.values(bindings));
 const render=()=>{index=0;ei=0;return Boundary({children:'private'})};
 const previous=globalThis.window;globalThis.window={addEventListener(){},removeEventListener(){}};
 try{render();while(effects.length)effects.shift()();listener('SIGNED_OUT',null);settle({data:{session:{user:{id:'old'}}},error:null});await Promise.resolve();await Promise.resolve();const tree=render();while(effects.length)effects.shift()();assert.deepEqual(routes,['/login']);assert.equal(tree.type,'main');assert.equal(states[1],null);}finally{globalThis.window=previous;}
});
