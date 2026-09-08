import test from 'node:test';import assert from 'node:assert/strict';
let pit;try{pit=await import('../.engine-test/auryn/v91/point-in-time.js')}catch{}
test('V9.1 replay applies global macro rows to each stock without leaking future vintages',()=>{
 assert.ok(pit);
 const events=[{symbol:'__MACRO__',metric:'fed_funds_rate',value:5.25,availableAt:'2024-01-15'},{symbol:'__MACRO__',metric:'fed_funds_rate',value:5.5,availableAt:'2024-02-15'}];
 assert.deepEqual(pit.resolvePointInTimeMetrics([],events,'AAA','2024-02-01'),{fed_funds_rate:5.25});
 assert.deepEqual(pit.resolvePointInTimeMetrics([],events,'AAA','2024-02-20'),{fed_funds_rate:5.5});
});
