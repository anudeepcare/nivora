import test from 'node:test';import assert from 'node:assert/strict';import {recoveryProof,validRecoveryProof} from '../lib/recovery-proof.ts';
test('recovery authorization binds account, session and expiry; existing sign-in cannot substitute',()=>{
 const now=100000,secret='test-only-secret',proof=recoveryProof('recovering-user','recovery-session',secret,now);
 assert.ok(validRecoveryProof(proof,'recovering-user','recovery-session',secret,now));
 for(const [user,token,key,time] of [['other-user','recovery-session',secret,now],['recovering-user','existing-login',secret,now],['recovering-user','recovery-session','wrong-key',now],['recovering-user','recovery-session',secret,now+900000]])assert.equal(validRecoveryProof(proof,user,token,key,time),false);
 assert.equal(validRecoveryProof(proof+'x','recovering-user','recovery-session',secret,now),false);
 assert.equal(validRecoveryProof(undefined,'recovering-user','recovery-session',secret,now),false);
});
