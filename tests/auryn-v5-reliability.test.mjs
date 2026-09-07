import test from 'node:test';
import assert from 'node:assert/strict';
import {validateV5ExecutionSnapshot,runV5ReliabilityMatrix,mapV5ActionToToday} from '../.engine-test/auryn/v5/reliability.js';
const mt=(ok=true,id='snap-1')=>({snapshotId:id,symbol:'TEST',asOf:'2026-09-08T15:00:00Z',session:'REGULAR',calendarState:'OPEN',priceState:ok?'LIVE_VERIFIED':'UNVERIFIED',decisionPrice:ok?100:null,displayPrice:ok?100:null,regularClose:99,extendedPrice:null,providerAgreementPct:.2,sources:[],priceSensitiveAllowed:ok,decisionAllowed:ok,reason:ok?'verified':'blocked'});

test('execution snapshot gate rejects unverified or mismatched market truth',()=>{
 assert.equal(validateV5ExecutionSnapshot({decisionSnapshotId:'snap-1',intentSnapshotId:'snap-1',marketTruth:mt(true)}).allowed,true);
 assert.equal(validateV5ExecutionSnapshot({decisionSnapshotId:'snap-1',intentSnapshotId:'snap-2',marketTruth:mt(true)}).allowed,false);
 assert.equal(validateV5ExecutionSnapshot({decisionSnapshotId:'snap-1',intentSnapshotId:'snap-1',marketTruth:mt(false)}).allowed,false);
});

test('V5 actions map into paper-lab actions without manufacturing trades',()=>{
 assert.equal(mapV5ActionToToday('BUY',false).action,'BUY');
 assert.equal(mapV5ActionToToday('BUY',true).action,'ADD');
 assert.equal(mapV5ActionToToday('HOLD',false).action,'HOLD');
 assert.equal(mapV5ActionToToday('REDUCE',true).action,'TRIM');
 assert.equal(mapV5ActionToToday('REDUCE',false).action,'AVOID');
 assert.equal(mapV5ActionToToday('SELL',true).action,'SELL');
});

test('deterministic reliability matrix covers at least 10,000 real-world combinations with zero invariant violations',()=>{
 const r=runV5ReliabilityMatrix();
 assert.ok(r.cases>=10000);
 assert.equal(r.violations.length,0);
 assert.ok(r.dimensions.includes('priceState'));
 assert.ok(r.dimensions.includes('valuationAvailable'));
 assert.ok(r.dimensions.includes('ownership'));
});

import fs from 'node:fs';
test('validation and paper runner carry V5 canonical snapshot/action into the execution pipeline',()=>{
 const stock=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
 assert.match(stock,/v5:v5Analysis\?\{snapshotId:v5Analysis\.snapshotId/);
 const runner=fs.readFileSync(new URL('../app/api/trading-lab/run-paper/route.ts',import.meta.url),'utf8');
 assert.match(runner,/mapV5ActionToToday/);
 assert.match(runner,/snapshot\.evidence\?\.v5/);
});
