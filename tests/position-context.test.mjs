import test from 'node:test';import assert from 'node:assert/strict';import {positionContext} from '../lib/position-context.ts';
const p=(id,symbol,quantity)=>({id,symbol,quantity,cost:10,currency:'USD',assetType:'stock'}),q={price:100,changePct:0,currency:'USD',stale:false,asOf:'2026-10-19',source:'fixture',session:'closed'};
test('position context combines lots and uses the canonical priced denominator',()=>{const x=positionContext([p('1','APP',2),p('2','APP',1),p('3','SAP',1)],{APP:q,SAP:{...q,price:200}},'APP',20);assert.equal(x.quantity,3);assert.equal(x.value,300);assert.equal(x.weight,60);assert.equal(x.gapLoss,60);});
test('older USD quotes retain exposure while non-dollar quotes remain unconverted',()=>{
 const older=positionContext([p('1','SAP',2)],{SAP:{...q,stale:true}},'SAP',10);assert.equal(older.value,200);assert.equal(older.gapLoss,20);assert.deepEqual(older.missing,[]);
 const foreign=positionContext([p('1','SAP',2)],{SAP:{...q,currency:'EUR'}},'SAP',10);assert.equal(foreign.value,null);assert.deepEqual(foreign.missing,['SAP']);
});
