import test from 'node:test';import assert from 'node:assert/strict';
import {billingDiagnostic} from '../lib/billing-diagnostics.ts';
test('billing errors identify configuration faults without exposing Stripe messages or secrets',()=>{
 for(const [e,code] of [[{type:'StripeAuthenticationError',message:'sk_test_secret'},'stripe_auth'],[{type:'StripePermissionError'},'stripe_permission'],[{type:'StripeInvalidRequestError',code:'resource_missing',param:'price'},'stripe_resource'],[{code:'PGRST202'},'billing_database']]){
  const d=billingDiagnostic(e,'checkout','ref_test');assert.equal(d.code,code);assert.doesNotMatch(JSON.stringify(d),/sk_test_secret/);
 }
 const d=billingDiagnostic(new Error('SQL user@example.com token=SECRET'),'checkout','ref_test');assert.equal(d.code,'billing_unavailable');assert.doesNotMatch(JSON.stringify(d),/SECRET|user@example/);assert.match(d.message,/ref_test/);
});
