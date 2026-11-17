import test from 'node:test';
import assert from 'node:assert/strict';
import {supportDeliveryStatus,supportDeliveryError} from '../lib/support-status.ts';
const env={AURYN_SUPPORT_EMAIL_ENABLED:'true',RESEND_API_KEY:'private-key',AURYN_SUPPORT_FROM:'AURYN <support@auryninvest.com>',VERCEL_ENV:'production'};
test('owner configuration distinguishes preview, test sender, missing settings and configured delivery',()=>{
 assert.equal(supportDeliveryStatus(env).ready,true);
 assert.equal(supportDeliveryStatus(env).recipient,'support@auryninvest.com');
 assert.match(supportDeliveryStatus({...env,VERCEL_ENV:'preview'}).issue,/preview/);
 assert.match(supportDeliveryStatus({...env,AURYN_SUPPORT_FROM:'onboarding@resend.dev'}).issue,/test domain/);
 assert.equal(JSON.stringify(supportDeliveryStatus(env)).includes('private-key'),false);
});
test('provider errors explain remediation without echoing provider personal data',()=>{
 const result=supportDeliveryError(403,'You can only send testing emails to your own email address (private@gmail.com)');
 assert.match(result,/Verify auryninvest.com/);assert.ok(!result.includes('private@gmail.com'));
 assert.match(supportDeliveryError(429),/limit/);
 assert.match(supportDeliveryError(403,'domain is not verified'),/verification/);
});
