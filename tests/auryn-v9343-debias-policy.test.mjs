import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInstitutionalDecisionKernel} from '../.engine-test/auryn/v931/decision-kernel.js';

const technical=(o={})=>({trend:74,momentum:72,flow:68,structure:76,nearResistance:true,confirmedBreakout:true,structuralBreak:false,reclaimLevel:110,invalidation:90,...o});
const build=(over={})=>buildInstitutionalDecisionKernel({
  snapshotId:'X-1',symbol:'X',marketPrice:100,executionTradable:false,previousSetupState:null,
  scores:{business:80,earningsRevisions:76,valuation:70,marketStructure:78,catalystsRegime:58,riskAsymmetry:70},
  technical:technical(),evidenceCompleteness:92,canonicalAction:'HOLD',canonicalOwnerAction:'HOLD',...over
});

test('legacy HOLD cannot force an otherwise qualified V9.3.4 decision back to WAIT',()=>{
  const d=build();
  assert.notEqual(d.newMoneyAction,'WAIT');
  assert.ok(['STRONG_BUY','BUY','START_SMALL'].includes(d.newMoneyAction));
  assert.equal(d.hardVetoReasons.length,0);
});

test('missing valuation lowers completeness but does not act like a bearish zero',()=>{
  const d=build({scores:{business:82,earningsRevisions:78,valuation:null,marketStructure:76,catalystsRegime:60,riskAsymmetry:72},evidenceCompleteness:78,canonicalAction:'HOLD'});
  assert.notEqual(d.newMoneyAction,'WAIT');
  assert.equal(d.pillars.valuation.state,'UNAVAILABLE');
  assert.ok(d.evidenceCompleteness<90);
});

test('confirmed structural invalidation is a hard veto even when other pillars are strong',()=>{
  const d=build({technical:technical({structuralBreak:true,confirmedBreakout:false,nearResistance:false})});
  assert.equal(d.newMoneyAction,'AVOID');
  assert.ok(d.hardVetoReasons.some(x=>/structural/i.test(x)));
});

test('owner policy can express WATCH rather than compressing everything into HOLD',()=>{
  const d=build({scores:{business:60,earningsRevisions:48,valuation:null,marketStructure:46,catalystsRegime:48,riskAsymmetry:42},technical:technical({trend:42,momentum:48,flow:44,structure:45,nearResistance:false,confirmedBreakout:false}),evidenceCompleteness:70,canonicalAction:'HOLD'});
  assert.equal(d.ownerAction,'WATCH');
});

test('all new-money actions are reachable without quotas',()=>{
  const strong=build({scores:{business:92,earningsRevisions:90,valuation:86,marketStructure:90,catalystsRegime:76,riskAsymmetry:84},technical:technical({trend:86,momentum:82,flow:78,structure:88,confirmedBreakout:true}),evidenceCompleteness:96,canonicalAction:'HOLD'}).newMoneyAction;
  const buy=build({scores:{business:76,earningsRevisions:70,valuation:64,marketStructure:70,catalystsRegime:56,riskAsymmetry:62},technical:technical({trend:68,momentum:66,flow:62,structure:68,confirmedBreakout:false}),evidenceCompleteness:88,canonicalAction:'HOLD'}).newMoneyAction;
  const small=build({scores:{business:72,earningsRevisions:64,valuation:null,marketStructure:63,catalystsRegime:52,riskAsymmetry:58},technical:technical({trend:60,momentum:61,flow:55,structure:62,confirmedBreakout:false}),evidenceCompleteness:72,canonicalAction:'HOLD'}).newMoneyAction;
  const wait=build({scores:{business:62,earningsRevisions:54,valuation:52,marketStructure:51,catalystsRegime:50,riskAsymmetry:50},technical:technical({trend:50,momentum:50,flow:50,structure:50,nearResistance:false,confirmedBreakout:false}),evidenceCompleteness:82,canonicalAction:'HOLD'}).newMoneyAction;
  const avoid=build({scores:{business:34,earningsRevisions:32,valuation:40,marketStructure:28,catalystsRegime:42,riskAsymmetry:24},technical:technical({trend:20,momentum:30,flow:30,structure:25,nearResistance:false,confirmedBreakout:false,structuralBreak:true}),evidenceCompleteness:90,canonicalAction:'SELL'}).newMoneyAction;
  assert.deepEqual(new Set([strong,buy,small,wait,avoid]),new Set(['STRONG_BUY','BUY','START_SMALL','WAIT','AVOID']));
});

import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;

test('Trading Lab treats legacy V5 as challenger, not an automatic divergence veto',()=>{
 const run=fs.readFileSync(root+'app/api/trading-lab/run-paper/route.ts','utf8');
 assert.match(run,/mapInstitutionalActionToToday/);
 assert.doesNotMatch(run,/CANONICAL_DECISION_DIVERGENCE/);
 assert.match(run,/hardVetoReasons/);
});
