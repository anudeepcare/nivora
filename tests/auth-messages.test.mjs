import test from 'node:test';import assert from 'node:assert/strict';
import {friendlyAuthMessage as f} from '../lib/auth-messages.ts';
test('common provider messages become plain language without revealing whether an account exists',()=>{
 assert.match(f('Invalid login credentials'),/email and password do not match/);
 assert.doesNotMatch(f('Invalid login credentials'),/no account|not registered|exists/i);
 assert.match(f('Email not confirmed'),/Confirm your email/);
 assert.match(f('Email rate limit exceeded'),/Too many attempts/);
 assert.match(f('Password should be at least 6 characters.'),/at least 8 characters/);
 assert.match(f('TypeError: Failed to fetch'),/couldn’t reach AURYN/);
 assert.match(f('Unable to validate email address: invalid format'),/valid email/);
});
test('unknown messages are kept and empty ones get a mode-specific default',()=>{
 assert.equal(f('Something specific happened'),'Something specific happened');
 assert.equal(f(''),'Unable to sign in.');assert.equal(f(undefined,'signup'),'Unable to create the account.');assert.equal(f(null,'reset'),'Unable to send the reset link.');
});
