import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('PWA never caches private API responses and supplies a navigation-only offline fallback',async()=>{assert.ok(fs.existsSync(new URL('../public/sw.js',import.meta.url)),'PWA worker must exist');const handlers={};const scope={addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:()=>{},clients:{claim:()=>{}},location:{origin:'https://auryn.example'}};vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self:scope,URL,fetch:async()=>{throw Error('offline')},Response,caches:{open:async()=>({addAll:async()=>{}}),match:async()=>new Response('offline document')}});let intercepted=false;handlers.fetch({request:{url:'https://auryn.example/api/workspace',method:'GET',mode:'cors'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);let result;handlers.fetch({request:{url:'https://auryn.example/portfolio',method:'GET',mode:'navigate'},respondWith:p=>result=p});assert.equal(await(await result).text(),'offline document')});

test('an installed update waits for explicit activation instead of interrupting work',async()=>{
 const handlers={};let activated=0;let install;
 const scope={addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:()=>activated++,clients:{claim:()=>{}},location:{origin:'https://auryn.example'}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self:scope,URL,Response,caches:{open:async()=>({addAll:async()=>{}})}});
 handlers.install({waitUntil:p=>install=p});await install;assert.equal(activated,0);
 handlers.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(activated,1);
});
