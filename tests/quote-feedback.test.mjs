import test from 'node:test';
import assert from 'node:assert/strict';
import {publishQuotes,subscribeQuotes} from '../lib/shared-quotes.ts';
test('consumer connection labels cannot rebroadcast an unchanged observation forever',()=>{
 const cache=new Map();let notifications=0;
 const quote={price:100,currency:'USD',asOf:'2026-11-06T19:00:00Z',source:'EODHD · streaming venue trades',session:'Live · regular session',stale:false};
 subscribeQuotes(cache,()=>notifications++);
 for(let i=0;i<20;i++)publishQuotes(cache,{APP:{quote:{...quote,session:i%2?'Last streamed trade · reconnecting':'Live · regular session'}}});
 assert.equal(notifications,1);
 publishQuotes(cache,{APP:{quote:{...quote,price:101,asOf:'2026-11-06T19:00:01Z'}}});
 assert.equal(notifications,2);
});
