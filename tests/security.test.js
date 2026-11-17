import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiKeyAccessControl,BrowserSessionStore,FixedWindowLimiter,RequestGuard,clientAddress} from '../src/server/security.js';

test('API authentication rejects missing and incorrect bearer credentials',()=>{
  const auth=new ApiKeyAccessControl({apiKey:'correct horse battery staple'});
  assert.equal(auth.configured,true);
  assert.equal(auth.authenticate(undefined).status,'unauthorized');
  assert.equal(auth.authenticate('Bearer wrong').status,'unauthorized');
  const accepted=auth.authenticate('Bearer correct horse battery staple');
  assert.equal(accepted.status,'authenticated');
  assert.match(accepted.principal,/^key:/);
  assert.equal(JSON.stringify(accepted).includes('correct horse battery staple'),false);
});

test('unconfigured authentication is explicit and never treats a request as authenticated',()=>{
  const auth=new ApiKeyAccessControl({apiKey:''});
  assert.equal(auth.configured,false);
  assert.equal(auth.authenticate('Bearer anything').status,'not-configured');
});

test('per-client limiter blocks excess requests and reports a bounded retry',()=>{
  let now=1000;const limiter=new FixedWindowLimiter({limit:2,windowMs:10000,now:()=>now,maxClients:10});
  assert.equal(limiter.consume('key:one').allowed,true);
  assert.equal(limiter.consume('key:one').allowed,true);
  const denied=limiter.consume('key:one');assert.equal(denied.allowed,false);assert.equal(denied.retryAfterSeconds,10);
  assert.equal(limiter.consume('key:two').allowed,true);
  now=11000;assert.equal(limiter.consume('key:one').allowed,true);
});

test('client identity ignores spoofable forwarding headers',()=>{
  const req={headers:{'x-forwarded-for':'203.0.113.8'},socket:{remoteAddress:'127.0.0.1'}};
  assert.equal(clientAddress(req),'127.0.0.1');
});
test('request guard protects configured APIs while leaving health observable',()=>{const guard=new RequestGuard({apiKey:'123456789012345678901234',limit:3,windowMs:60000});const request=authorization=>({headers:{authorization},socket:{remoteAddress:'127.0.0.1'}});assert.equal(guard.check(request(),{publicPath:false}).status,'unauthorized');assert.equal(guard.check(request(),{publicPath:true}).status,'allowed');assert.equal(guard.check(request('Bearer 123456789012345678901234'),{publicPath:false}).status,'allowed')});
test('browser sessions exchange a valid key for an opaque expiring HttpOnly cookie',()=>{let now=1000;const sessions=new BrowserSessionStore({now:()=>now,ttlMs:5000,randomBytes:()=>Buffer.alloc(32,7)}),created=sessions.create('key:abc');assert.match(created.cookie,/^auryn_session=[A-Za-z0-9_-]+; HttpOnly; SameSite=Strict; Path=\/; Max-Age=5$/);assert.equal(created.cookie.includes('abc'),false);assert.equal(sessions.authenticate(created.cookie).principal,'key:abc');now=7000;assert.equal(sessions.authenticate(created.cookie),null)});
test('request guard accepts an authenticated browser session without exposing the API key',()=>{const sessions=new BrowserSessionStore(),guard=new RequestGuard({apiKey:'123456789012345678901234',sessions});const login=guard.createSession('123456789012345678901234');assert.equal(login.status,'authenticated');const req={headers:{cookie:login.cookie},socket:{remoteAddress:'127.0.0.1'}};assert.equal(guard.check(req).status,'allowed');assert.equal(login.cookie.includes('123456789012345678901234'),false)});
test('cookie-authenticated writes require an explicit matching Origin',()=>{const key='123456789012345678901234',guard=new RequestGuard({apiKey:key}),login=guard.createSession(key),base={method:'POST',socket:{remoteAddress:'127.0.0.1'}};assert.deepEqual(guard.check({...base,headers:{host:'127.0.0.1:4173',cookie:login.cookie}}).status,'unauthorized');assert.equal(guard.check({...base,headers:{host:'127.0.0.1:4173',origin:'http://127.0.0.1:4173',cookie:login.cookie}}).status,'allowed')});
test('bearer-authenticated non-browser writes may omit Origin',()=>{const key='123456789012345678901234',guard=new RequestGuard({apiKey:key}),result=guard.check({method:'POST',headers:{authorization:`Bearer ${key}`},socket:{remoteAddress:'127.0.0.1'}});assert.equal(result.status,'allowed')});
