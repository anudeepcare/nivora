import test from 'node:test';
import assert from 'node:assert/strict';
import { expiryComparison } from '../lib/options-expiry-comparison.ts';
const c=(id,expiry,type,volume,oi,observed='2026-11-06')=>({id,expiry,type,volume,oi,observed,strike:100,standard:true,multiplier:100,bid:1,ask:2});
test('expiry comparison deduplicates latest contracts and distinguishes partial coverage',()=>{
 const rows=expiryComparison([c('a','2026-11-13','call',10,20),c('a','2026-11-13','call',15,25,'2026-11-07'),c('b','2026-11-13','put',null,30),c('x','2026-12-18','call',0,0)]);
 assert.equal(rows.length,2);assert.equal(rows[0].contracts,2);assert.equal(rows[0].callVolume,15);assert.equal(rows[0].putVolume,null);assert.equal(rows[0].volumeCoverage,1);assert.equal(rows[0].oi,55);assert.equal(rows[1].callVolume,0);assert.equal(rows[1].putVolume,null);
});
test('comparison excludes invalid dates and nonstandard contracts',()=>{
 assert.deepEqual(expiryComparison([{...c('a','2026-02-30','call',10,20)},{...c('b','2026-12-18','put',20,30),standard:false}]),[]);
});
