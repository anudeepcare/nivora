// Compiled routes, synthetic transport; no real Stripe payment is represented by this test.
import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),route=p=>require('../.next/server/app/api/'+p+'/route.js').routeModule.userland;
let checks=0;
for(const method of ['GET','POST']){const r=await route('billing')[method](new Request('https://auryn.example/api/billing',{method,...(method==='POST'?{body:JSON.stringify({action:'checkout',customer:'cus_attacker',price:'price_attacker'})}:{})}));assert.equal(r.status,401);checks++;}
process.env.STRIPE_SECRET_KEY='sk_test_fixture_only';process.env.STRIPE_PRO_PRICE_ID='price_fixture_only';process.env.STRIPE_WEBHOOK_SECRET='whsec_fixture_only';process.env.AURYN_APP_URL='https://www.auryninvest.com';process.env.AURYN_BILLING_MODE='test';process.env.AURYN_ACCESS_ENABLED='true';process.env.AURYN_OWNER_USER_ID='00000000-0000-4000-8000-000000000001';
let r=await route('billing/webhook').POST(new Request('https://auryn.example/api/billing/webhook',{method:'POST',body:'{}'}));assert.equal(r.status,400);checks++;
r=await route('billing/webhook').POST(new Request('https://auryn.example/api/billing/webhook',{method:'POST',headers:{'stripe-signature':'t=1,v1=bad'},body:'{}'}));assert.equal(r.status,400);checks++;
const Stripe=(await import('stripe')).default,stripe=new Stripe('sk_test_fixture_only');
for(const live of [false,true]){
 const body=JSON.stringify({id:'evt_fixture',object:'event',type:'customer.created',livemode:live,data:{object:{id:'cus_fixture'}}}),header=stripe.webhooks.generateTestHeaderString({payload:body,secret:process.env.STRIPE_WEBHOOK_SECRET});
 r=await route('billing/webhook').POST(new Request('https://auryn.example/api/billing/webhook',{method:'POST',headers:{'stripe-signature':header},body}));assert.equal(r.status,live?400:200);checks++;
}
console.log(`${checks} billing API checks passed: auth required, unsigned/tampered events rejected, mode isolation and irrelevant signed events ignored. No actual payment processed.`);
