import {createRequire} from 'node:module';const require=createRequire(import.meta.url);import test from 'node:test';import assert from 'node:assert/strict';
const {planPaperOrder,simulatePaperFill}=require('../.engine-test/nivora-paper-execution.js');
const intent={id:'abc123',symbol:'IREN',side:'BUY',intentType:'ENTER',referencePrice:50,targetNotional:5000,createdAt:'2026-09-01T14:00:00Z'};
test('paper order has deterministic id and protected limit',()=>{const a=planPaperOrder(intent,4000,50,0.25),b=planPaperOrder(intent,4000,50,0.25);assert.equal(a.clientOrderId,b.clientOrderId);assert.equal(a.type,'limit');assert.ok(a.limitPrice>=50&&a.limitPrice<=50.25)});
test('paper fill models bounded slippage and fees',()=>{const x=simulatePaperFill({side:'BUY',quantity:80,limitPrice:50.2},50,0.1,0.005);assert.ok(x.fillPrice>=50);assert.ok(x.fillPrice<=50.2);assert.ok(x.fees>=0)});
