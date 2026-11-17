import test from 'node:test';import assert from 'node:assert/strict';
import * as module from '../lib/preference-store.ts';
test('two consumers serialize writes and merge latest acknowledged fields',async()=>{
 assert.equal(typeof module.preferenceStore,'function');const cache=new Map();const a=module.preferenceStore(cache,'a'),b=module.preferenceStore(cache,'a');assert.equal(a,b);
 const writes=[];const write=async v=>{await new Promise(r=>setTimeout(r,5));writes.push(v)};
 await Promise.all([a.save({style:'Growth'},{},write),b.save({chartRange:'3M'},{},write)]);
 assert.equal(writes[1].style,'Growth');assert.equal(writes[1].chartRange,'3M');assert.equal(module.preferenceStore(cache,'b').snapshot().value,null);
});
