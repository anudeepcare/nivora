import test from 'node:test';
import assert from 'node:assert/strict';
import {retainResearchQuote} from '../lib/research-quote.ts';
const prior={price:27.67,currency:'USD',asOf:'2026-10-19T18:47:00Z',stale:false,session:'Live · regular session',source:'stream'};
test('research retains a usable observed price across missing, invalid and older refreshes',()=>{
 for(const incoming of [undefined,{...prior,price:null},{...prior,price:NaN},{...prior,price:26,asOf:'2026-10-16T20:00:00Z'}])assert.equal(retainResearchQuote(prior,incoming).price,27.67);
 assert.equal(retainResearchQuote(prior,{...prior,price:28,asOf:'2026-10-19T18:48:00Z'}).price,28);
});
test('retained prices never leak across currencies and retain observation time',()=>{
 assert.equal(retainResearchQuote(prior,{...prior,price:25,currency:'EUR'}).currency,'EUR');
 assert.equal(retainResearchQuote(prior,{...prior,price:null}).asOf,prior.asOf);
});
