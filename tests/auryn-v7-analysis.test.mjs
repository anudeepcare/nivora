import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAurynV7Analysis} from '../.engine-test/auryn/v7/analyze.js';
import {AURYN_V7_ENGINE_VERSION} from '../.engine-test/auryn/v7/version.js';

const plan={snapshotId:'S1',state:'READY',intent:'WATCH',reason:'wait',currentPrice:100,initialEntry:{label:'Watch zone',low:95,high:99,multiplier:0,basis:'structure'},dcaZones:[],confirmation:103,invalidation:90,targets:[{label:'T1',price:110},{label:'T2',price:120}],riskPerShare:10};
const scenario={snapshotId:'S1',intent:'WATCH',structure:'UPTREND',setup:'BREAKOUT_READY',confluenceScore:70,waveContext:{label:'supporting',confidence:'MEDIUM',note:'context'},bull:{label:'BULL',summary:'x',trigger:103,zoneLow:95,zoneHigh:99,targetLow:110,targetHigh:120,invalidation:90,confidence:'MEDIUM'},base:{label:'BASE',summary:'x',trigger:null,zoneLow:null,zoneHigh:null,targetLow:null,targetHigh:null,invalidation:90,confidence:'MEDIUM'},bear:{label:'BEAR',summary:'x',trigger:90,zoneLow:null,zoneHigh:null,targetLow:null,targetHigh:null,invalidation:90,confidence:'MEDIUM'}};
const v6={version:'auryn-v6',engineVersion:'auryn-v6-proof-os-1',snapshotId:'S1',symbol:'TEST',asOf:'2026-09-07T20:00:00Z',v5:{snapshotId:'S1',marketTruth:{snapshotId:'S1',decisionPrice:100,priceSensitiveAllowed:true},executionPlan:plan,scenario,decision:{primaryAction:'HOLD'},metrics:[{id:'valuation',available:false}]},evidenceConfidence:{score:80,label:'HIGH',note:''},decisionStrength:{score:70,label:'MEDIUM',note:''},modelProof:{grade:'UNPROVEN'},multiTimeframe:{},valuation:{},portfolio:null};

test('V7 wraps V6 with canonical trust audit and version',()=>{
 const v7=buildAurynV7Analysis({v6});
 assert.equal(v7.version,'auryn-v7');
 assert.equal(v7.engineVersion,AURYN_V7_ENGINE_VERSION);
 assert.equal(v7.snapshotId,'S1');
 assert.equal(v7.trust.state,'PASS');
 assert.equal(v7.v6,v6);
});

test('V7 blocks when scenario and execution plan disagree',()=>{
 const bad=structuredClone(v6);bad.v5.scenario.bull.trigger=104;
 const v7=buildAurynV7Analysis({v6:bad});
 assert.equal(v7.trust.state,'BLOCK');
});
