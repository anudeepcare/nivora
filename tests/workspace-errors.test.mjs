import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceFailure } from '../lib/workspace-errors.ts';
test('database token rejection reaches the browser as 401 for session recovery',()=>{
 assert.equal(workspaceFailure([{status:401,error:{code:'PGRST301'}}]).status,401);
});
test('actual permission denial is distinct from unavailable infrastructure',()=>{
 assert.equal(workspaceFailure([{status:403,error:{code:'42501'}}]).status,403);
 assert.equal(workspaceFailure([{status:503,error:{code:'XX000'}}]).status,503);
 assert.doesNotMatch(workspaceFailure([{status:503,error:{code:'XX000'}}]).message,/permissions/i);
});
test('a successful sibling query cannot hide a rejected workspace query',()=>{
 assert.equal(workspaceFailure([{status:200,error:null},{status:401,error:{code:'PGRST303'}}]).status,401);
});
