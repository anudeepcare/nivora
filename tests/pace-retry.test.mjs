import test from 'node:test';
import assert from 'node:assert/strict';
import {paceRetryDelay} from '../lib/pace-retry.ts';
test('incomplete Pace retries after cache expiry twice then stops',()=>{
 assert.equal(paceRetryDelay(0,true),31000);
 assert.equal(paceRetryDelay(1,true),61000);
 assert.equal(paceRetryDelay(2,true),null);
 assert.equal(paceRetryDelay(0,false),null);
 assert.equal(paceRetryDelay(-1,true),null);
});
import {readFileSync} from 'node:fs';
test('mounted scan schedules bounded retries and cancels on navigation',()=>{
 const s=readFileSync('components/WorkspacePace.tsx','utf8');
 assert.match(s,/paceRetryDelay\(retries.current.attempt, failed\)/);
 assert.match(s,/retries.current.attempt \+= 1/);
 assert.match(s,/clearTimeout\(retryTimer\)/);
 assert.match(s,/document.visibilityState !== "hidden"/);
});
