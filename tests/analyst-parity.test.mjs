import test from 'node:test';import assert from 'node:assert/strict';
import {compareAnalystSnapshots} from '../lib/analyst-parity.ts';
const row={symbol:'NBIS',currency:'USD',closeDate:'2026-11-11',close:154.69,low:84,consensus:278.05,high:410,analysts:20};
test('a matching sample cannot stand in for an incomplete cohort',()=>{const r=compareAnalystSnapshots(['NBIS','APP'],[row],[row]);assert.equal(r.agreement,.5);assert.equal(r.compared,1);assert.equal(r.completeExactMatch,false);});
test('target, settled close, analyst count and date differences cannot pass parity',()=>{for(const change of [{low:83},{close:148.45},{analysts:19},{closeDate:'2026-11-10'}])assert.equal(compareAnalystSnapshots(['NBIS'],[row],[{...row,...change}]).completeExactMatch,false);assert.equal(compareAnalystSnapshots(['NBIS'],[row],[row]).completeExactMatch,true);});
test('duplicate and invalid observations cannot inflate match rates',()=>{assert.throws(()=>compareAnalystSnapshots(['NBIS'],[row,row],[row]));assert.equal(compareAnalystSnapshots(['NBIS'],[row],[{...row,low:NaN}]).compared,0);});
