import test from 'node:test';
import assert from 'node:assert/strict';
import {CustomerAuth,parseAuthCookies} from '../src/server/customer-auth.js';

const response=(status,data,headers={})=>({ok:status>=200&&status<300,status,headers:{get:name=>headers[String(name).toLowerCase()]??null},json:async()=>data});

test('customer login exchanges credentials server-side and stores tokens only in HttpOnly cookies',async()=>{
  const calls=[];
  const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',secureCookies:true,fetchImpl:async(url,options)=>{
    calls.push({url,options});
    return response(200,{access_token:'access-secret',refresh_token:'refresh-secret',expires_in:3600,user:{id:'user-1',email:'person@example.com'}});
  }});
  const result=await auth.login({email:' Person@Example.com ',password:'correct horse battery staple'});
  assert.equal(result.status,'authenticated');
  assert.deepEqual(result.user,{id:'user-1',email:'person@example.com'});
  assert.equal(JSON.stringify(result).includes('access-secret'),false);
  assert.equal(calls[0].url,'https://auth.example.test/auth/v1/token?grant_type=password');
  assert.equal(JSON.parse(calls[0].options.body).email,'person@example.com');
  const cookies=auth.sessionCookies(result.session);
  assert.equal(cookies.length,2);
  assert.ok(cookies.every(cookie=>/HttpOnly/.test(cookie)&&/SameSite=Lax/.test(cookie)&&/Secure/.test(cookie)));
  assert.equal(parseAuthCookies(cookies.join('; ')).accessToken,'access-secret');
});

test('customer auth refreshes an expired access token and verifies the current user',async()=>{
  const calls=[];
  const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async(url,options)=>{
    calls.push(url);
    if(url.endsWith('/auth/v1/user')&&options.headers.authorization==='Bearer expired')return response(401,{message:'expired'});
    if(url.includes('grant_type=refresh_token'))return response(200,{access_token:'fresh',refresh_token:'rotated',expires_in:3600,user:{id:'user-1',email:'person@example.com'}});
    if(url.endsWith('/auth/v1/user')&&options.headers.authorization==='Bearer fresh')return response(200,{id:'user-1',email:'person@example.com'});
    return response(500,{message:'unexpected'});
  }});
  const result=await auth.authenticate({headers:{cookie:'auryn_access=expired; auryn_refresh=refresh'}});
  assert.equal(result.status,'authenticated');
  assert.equal(result.user.id,'user-1');
  assert.equal(result.session.accessToken,'fresh');
  assert.deepEqual(calls,[
    'https://auth.example.test/auth/v1/user',
    'https://auth.example.test/auth/v1/token?grant_type=refresh_token',
    'https://auth.example.test/auth/v1/user',
  ]);
});

test('signup and recovery validate inputs before any provider request',async()=>{
  let calls=0;
  const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async()=>{calls++;return response(500,{})}});
  assert.equal((await auth.signup({email:'bad',password:'short'})).status,'invalid-request');
  assert.equal((await auth.recovery({email:'bad'})).status,'invalid-request');
  assert.equal(calls,0);
});

test('missing auth configuration fails closed without making a network request',async()=>{
  let calls=0;
  const auth=new CustomerAuth({fetchImpl:async()=>{calls++}});
  assert.equal((await auth.authenticate({headers:{cookie:''}})).status,'not-configured');
  assert.equal((await auth.login({email:'person@example.com',password:'correct horse battery staple'})).status,'not-configured');
  assert.equal(calls,0);
});

test('recovery callback verifies the supplied session and password update requires that session',async()=>{
  const calls=[];const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async(url,options)=>{calls.push({url,options});if(url.endsWith('/auth/v1/user')&&options.method==='GET')return response(200,{id:'user-1',email:'person@example.com'});if(url.endsWith('/auth/v1/user')&&options.method==='PUT')return response(200,{id:'user-1',email:'person@example.com'});return response(500,{})}});
  const accepted=await auth.acceptRecovery({accessToken:'recovery-access',refreshToken:'recovery-refresh',expiresIn:900});assert.equal(accepted.status,'recovery-authenticated');assert.equal(accepted.user.id,'user-1');
  const updated=await auth.updatePassword({headers:{cookie:'auryn_access=recovery-access; auryn_refresh=recovery-refresh'}},'a genuinely new password');assert.equal(updated.status,'password-updated');assert.equal(JSON.parse(calls.at(-1).options.body).password,'a genuinely new password');
});

test('invalid recovery callback and password update make no privileged request',async()=>{let calls=0;const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async()=>{calls++;return response(500,{})}});assert.equal((await auth.acceptRecovery({accessToken:'',refreshToken:''})).status,'invalid-request');assert.equal((await auth.updatePassword({headers:{}},'short')).status,'invalid-request');assert.equal(calls,0)});

test('refresh-only logout obtains an access token and revokes it before confirming sign out',async()=>{const calls=[];const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async(url,options)=>{calls.push({url,options});if(url.includes('grant_type=refresh_token'))return response(200,{access_token:'fresh-access',refresh_token:'rotated-refresh',expires_in:3600,user:{id:'user-1',email:'person@example.com'}});if(url.endsWith('/auth/v1/logout'))return response(204,{});return response(500,{})}});assert.equal((await auth.logout({headers:{cookie:'auryn_refresh=refresh-only'}})).status,'signed-out');assert.equal(calls.length,2);assert.equal(calls[1].options.headers.authorization,'Bearer fresh-access')});

test('expired access plus refresh obtains a fresh token before logout revocation',async()=>{const calls=[];const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async(url,options)=>{calls.push({url,options});if(url.endsWith('/auth/v1/logout')&&options.headers.authorization==='Bearer expired')return response(401,{message:'expired'});if(url.includes('grant_type=refresh_token'))return response(200,{access_token:'fresh-access',refresh_token:'rotated-refresh',expires_in:3600,user:{id:'user-1',email:'person@example.com'}});if(url.endsWith('/auth/v1/logout')&&options.headers.authorization==='Bearer fresh-access')return response(204,{});return response(500,{})}});assert.equal((await auth.logout({headers:{cookie:'auryn_access=expired; auryn_refresh=refresh-token'}})).status,'signed-out');assert.equal(calls.length,3);assert.equal(calls.at(-1).options.headers.authorization,'Bearer fresh-access')});

test('provider rate limits remain retryable for authentication and logout',async()=>{const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async()=>response(429,{message:'slow down'},{'retry-after':'17'})});const authenticated=await auth.authenticate({headers:{cookie:'auryn_access=existing; auryn_refresh=refresh'}});assert.deepEqual(authenticated,{status:'rate-limited',retryAfterSeconds:17});const loggedOut=await auth.logout({headers:{cookie:'auryn_access=existing; auryn_refresh=refresh'}});assert.deepEqual(loggedOut,{status:'rate-limited',retryAfterSeconds:17})});

test('password recovery sends redirect_to as the documented query parameter',async()=>{let call;const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async(url,options)=>{call={url,options};return response(200,{})}});assert.equal((await auth.recovery({email:'person@example.com',redirectTo:'https://auryn.example/account/update-password'})).status,'accepted');assert.equal(call.url,'https://auth.example.test/auth/v1/recover?redirect_to=https%3A%2F%2Fauryn.example%2Faccount%2Fupdate-password');assert.deepEqual(JSON.parse(call.options.body),{email:'person@example.com'})});

test('auth-provider outages remain retryable and are not converted to unauthenticated',async()=>{const auth=new CustomerAuth({url:'https://auth.example.test',publishableKey:'public-test-key',fetchImpl:async()=>{throw new Error('offline')}});assert.equal((await auth.authenticate({headers:{cookie:'auryn_access=existing; auryn_refresh=refresh'}})).status,'network-error');assert.equal((await auth.login({email:'person@example.com',password:'correct horse battery staple'})).status,'network-error')});

test('customer UI contains account flows and never asks for the local operator key',async()=>{
  const source=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8'));
  for(const term of['Welcome back','Create an account','Forgot password','Choose a new password','/api/auth/session','/api/auth/signup','/api/auth/recovery/exchange','/api/auth/password'])assert.match(source,new RegExp(term));
  assert.doesNotMatch(source,/Unlock local Auryn|Local access key|AURYN_APP_API_KEY/);
  assert.match(source,/Sign out could not be confirmed/);
  assert.match(source,/RECOVERY_PENDING_KEY/);
  assert.match(source,/sessionStorage\.setItem\(RECOVERY_PENDING_KEY/);
  assert.match(source,/location\.reload\(\)/);
  assert.match(source,/settings-button.*authState\.canNavigate\(\)/s);
});
