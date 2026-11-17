import test from 'node:test';
import assert from 'node:assert/strict';
import {busiestStrike} from '../lib/options-snapshot.ts';
const base={id:'a',type:'call',strike:100,expiry:'2026-11-13',observed:'2026-11-06',volume:20};
test('volume ranking separates side and expiry, ignores stale observations and duplicate IDs',()=>{
 const rows=[base,base,{...base,id:'b',strike:110,volume:30},{...base,id:'c',strike:120,volume:900,observed:'2026-11-05'},{...base,id:'p',type:'put',volume:1000},{...base,id:'e',expiry:'2026-11-20',volume:2000}];
 assert.deepEqual(busiestStrike(rows,'call',base.expiry),{strike:110,volume:30,observed:base.observed,tied:false});
 assert.equal(busiestStrike(rows,'put',base.expiry).volume,1000);
});
test('missing or zero volume is not represented as a busiest level; ties disclosed',()=>{
 assert.equal(busiestStrike([{...base,volume:null},{...base,id:'b',volume:0}],'call',base.expiry),null);
 assert.equal(busiestStrike([base,{...base,id:'b',strike:110}],'call',base.expiry).tied,true);
});
