import test from 'node:test';
import assert from 'node:assert/strict';
import { canManagePaper } from '../lib/paper-policy.ts';
test('paper capability requires the configured owner and a trusted administrator grant', () => {
 const env={ownerId:'owner',adminIds:'admin,owner'};
 assert.equal(canManagePaper({id:'owner'},env),true);
 assert.equal(canManagePaper({id:'admin'},env),false);
 assert.equal(canManagePaper({id:'owner'},{ownerId:'owner'}),false);
 assert.equal(canManagePaper({id:'owner',app_metadata:{role:'admin'}},{ownerId:'owner'}),true);
 assert.equal(canManagePaper({id:'owner',app_metadata:{roles:['admin']}},{ownerId:'owner'}),true);
 assert.equal(canManagePaper({id:'owner',user_metadata:{role:'admin'}},{ownerId:'owner'}),false);
 assert.equal(canManagePaper({id:'owner',app_metadata:{role:'admin'}},{}),false);
});
