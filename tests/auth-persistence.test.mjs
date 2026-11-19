import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {authCookieOptions} from '../lib/auth-persistence.ts';
test('unchecked removes persistence only from auth token chunks, preserving scope and security',()=>{
 const options={path:'/',secure:true,sameSite:'lax',maxAge:300,expires:new Date('2027-01-01')};
 for(const name of ['sb-project-auth-token','sb-project-auth-token.0','sb-project-auth-token.9']) {
 const result=authCookieOptions(name,options,false);
 assert.equal(result.maxAge,undefined);assert.equal(result.expires,undefined);assert.equal(result.path,'/');assert.equal(result.secure,true);assert.equal(result.sameSite,'lax');
 }
 assert.deepEqual(authCookieOptions('sb-project-auth-token',options,true),options);
 assert.deepEqual(authCookieOptions('other',options,false),options);
 assert.equal(authCookieOptions('sb-project-auth-token',{...options,maxAge:0},false).maxAge,0);
});
test('browser refresh and all server exchange/recovery writes honor the cookie choice',()=>{
 const client=fs.readFileSync('lib/client.ts','utf8');assert.match(client,/authCookieOptions\(name, options, remember\)/);
 for(const file of ['app/auth/callback/route.ts','app/auth/confirm/route.ts','app/api/auth/recovery/route.ts'])assert.match(fs.readFileSync(file,'utf8'),/authCookieOptions\(/);
 const session=fs.readFileSync('components/Session.tsx','utf8');
 assert.doesNotMatch(session,/More sign-in options/);assert.match(session,/Continue with Google/);assert.match(session,/signInWithPassword/);assert.match(session,/setRememberSession\(remember\)/);assert.match(session,/Browser\s+restore can\s+retain/);
});
test('real Supabase constructors require Secure on HTTPS but permit local HTTP',()=>{
 const browser=fs.readFileSync('lib/client.ts','utf8');
 assert.match(browser,/createBrowserClient\(url, key, \{\s*cookieOptions: \{\s*secure:\s*typeof window !== "undefined" &&\s*window.location.protocol === "https:"/);
 for(const file of ['app/auth/callback/route.ts','app/auth/confirm/route.ts','app/api/auth/recovery/route.ts']) {
  assert.match(fs.readFileSync(file,'utf8'),/createServerClient\(url, key, \{\s*cookieOptions: \{ secure: new URL\(request.url\).protocol === "https:" \}/);
 }
 for(const secure of [true,false]) {
  const options=authCookieOptions('sb-project-auth-token.0',{secure,maxAge:86400,path:'/',sameSite:'lax'},false);
  assert.equal(options.secure,secure);assert.equal(options.maxAge,undefined);
 }
});
test('installed Supabase cookie storage emits Secure and session/deletion semantics',async()=>{
 const {createRequire}=await import('node:module');
 const {dirname,join}=await import('node:path');
 const require=createRequire(import.meta.url);
 const {createStorageFromOptions}=require(join(dirname(require.resolve('@supabase/ssr')),'cookies.js'));
 for(const secure of [true,false]) {
  const writes=[];
  const jar=new Map();
  const {storage}=createStorageFromOptions({cookieEncoding:'base64url',cookieOptions:{secure},cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>{for(const v of values){writes.push({...v,options:authCookieOptions(v.name,v.options,false)});if(v.value)jar.set(v.name,v.value);else jar.delete(v.name);}}}},false);
  await storage.setItem('sb-test-auth-token','synthetic-session-value');
  assert.ok(writes.length);assert.equal(writes.at(-1).options.secure,secure);assert.equal(writes.at(-1).options.maxAge,undefined);assert.equal(writes.at(-1).options.expires,undefined);
  await storage.removeItem('sb-test-auth-token');
  assert.equal(writes.at(-1).options.maxAge,0);assert.equal(writes.at(-1).options.secure,secure);
 }
});
