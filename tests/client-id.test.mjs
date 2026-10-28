import test from 'node:test';import assert from 'node:assert/strict';import {newRequestId} from '../lib/client-id.ts';
test('request IDs work without secure-context randomUUID and retain UUID v4 bits',()=>{
 const id=newRequestId({getRandomValues:a=>{a.fill(255);return a;}});
 assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 assert.equal(newRequestId({randomUUID:()=> '00000000-0000-4000-8000-000000000001'}),'00000000-0000-4000-8000-000000000001');
});
