import test from 'node:test';import assert from 'node:assert/strict';import {quoteTime} from '../lib/format.ts';
test('compact quote timestamps distinguish today, older dates and unknown time',()=>{
 const now=new Date('2026-10-19T16:53:00Z');
 assert.doesNotMatch(quoteTime('2026-10-19T16:52:00Z',true,now),/Oct/);
 const localDay=new Date('2026-10-16T20:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric'});
 assert.ok(quoteTime('2026-10-16T20:00:00Z',true,now).startsWith(`${localDay} ·`));
 assert.match(quoteTime('2025-10-16T20:00:00Z',true,now),/2025/);
 assert.equal(quoteTime('invalid',true,now),'Timestamp unavailable');
});
