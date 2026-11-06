import test from 'node:test';import assert from 'node:assert/strict';
import {historyBatch} from '../lib/history-batch.ts';
test('failed early histories do not starve later holdings',()=>{
 const symbols=Array.from({length:29},(_,i)=>'S'+i),attempted=new Set(symbols.slice(0,10));
 assert.deepEqual(historyBatch(symbols,new Set(),attempted),symbols.slice(10,20));
 assert.deepEqual(historyBatch(symbols,new Set(symbols.slice(10)),attempted),symbols.slice(0,10));
});
