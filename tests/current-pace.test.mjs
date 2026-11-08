import test from 'node:test';
import assert from 'node:assert/strict';
import { currentPace } from '../lib/current-pace.ts';
const now=Date.parse('2026-11-07T22:00:00Z');
test('historical P4 cannot support additions in a current P1 zone',()=>{
 const p=currentPace({multiplier:4,date:'2026-10-30',forming:{multiplier:1,date:'2026-11-06'}},now);
 assert.equal(p.level,1);assert.equal(p.eligibleLevel,1);assert.equal(p.changed,true);
});
test('forming deeper zones do not increase contribution eligibility',()=>{
 const p=currentPace({multiplier:2,date:'2026-10-30',forming:{multiplier:4,date:'2026-11-06'}},now);
 assert.equal(p.level,4);assert.equal(p.eligibleLevel,2);assert.equal(p.awaitingClose,true);
});
test('old or future observations cannot masquerade as current',()=>{
 for(const date of ['2026-10-30','2026-11-09','bad']) {
  const p=currentPace({multiplier:4,date:'2026-10-30',forming:{multiplier:4,date}},now);
  assert.equal(p.level,null);assert.equal(p.eligibleLevel,null);
 }
});
test('a fresh month close is current when a new forming month does not exist',()=>{
 const p=currentPace({multiplier:3,date:'2026-10-30'},Date.parse('2026-10-31T22:00:00Z'));
 assert.equal(p.level,3);assert.equal(p.provisional,false);
});
