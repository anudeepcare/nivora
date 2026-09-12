import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {auditAurynDecisions}=require('../.engine-test/auryn-decision-audit.js');

const rows=[
 {symbol:'A',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',opportunityScore:72,entryQuality:54,evidenceQuality:95,hardVetoReasons:[],policyReasons:['ENTRY_BELOW_CONFIRM'],distanceToBuy:4,currentPrice:100,bearValue:80,baseValue:101,bullValue:130},
 {symbol:'B',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',opportunityScore:68,entryQuality:52,evidenceQuality:90,hardVetoReasons:[],policyReasons:['PARTICIPATION_WEAK'],distanceToBuy:7,currentPrice:200,bearValue:160,baseValue:203,bullValue:250},
 {symbol:'C',newMoneyAction:'AVOID',ownerAction:'REDUCE',longTermAction:'ATTRACTIVE',opportunityScore:40,entryQuality:35,evidenceQuality:92,hardVetoReasons:['SEVERE_RISK_ASYMMETRY'],policyReasons:[],distanceToBuy:30,currentPrice:50,bearValue:30,baseValue:49,bullValue:70},
 {symbol:'D',newMoneyAction:'START_SMALL',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',opportunityScore:76,entryQuality:66,evidenceQuality:88,hardVetoReasons:[],policyReasons:[],distanceToBuy:0,currentPrice:80,bearValue:62,baseValue:92,bullValue:118},
 {symbol:'E',newMoneyAction:'BUY',ownerAction:'ADD',longTermAction:'ATTRACTIVE',opportunityScore:84,entryQuality:79,evidenceQuality:94,hardVetoReasons:[],policyReasons:[],distanceToBuy:0,currentPrice:120,bearValue:95,baseValue:145,bullValue:180},
 {symbol:'F',newMoneyAction:'WAIT',ownerAction:'WATCH',longTermAction:'SELECTIVE',opportunityScore:58,entryQuality:44,evidenceQuality:83,hardVetoReasons:[],policyReasons:['TIMING_WEAK'],distanceToBuy:10,currentPrice:60,bearValue:45,baseValue:61,bullValue:78},
 {symbol:'G',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'SELECTIVE',opportunityScore:62,entryQuality:50,evidenceQuality:80,hardVetoReasons:[],policyReasons:['VALUATION'],distanceToBuy:9,currentPrice:300,bearValue:240,baseValue:304,bullValue:360},
 {symbol:'H',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',opportunityScore:73,entryQuality:55,evidenceQuality:91,hardVetoReasons:[],policyReasons:['ENTRY_BELOW_CONFIRM'],distanceToBuy:5,currentPrice:90,bearValue:72,baseValue:91,bullValue:112},
 {symbol:'I',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'SELECTIVE',opportunityScore:55,entryQuality:48,evidenceQuality:75,hardVetoReasons:[],policyReasons:['FORWARD_WEAK'],distanceToBuy:12,currentPrice:40,bearValue:33,baseValue:40.4,bullValue:52},
 {symbol:'J',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',opportunityScore:71,entryQuality:53,evidenceQuality:89,hardVetoReasons:[],policyReasons:['ENTRY_BELOW_CONFIRM'],distanceToBuy:6,currentPrice:150,bearValue:110,baseValue:151,bullValue:200},
 {symbol:'K',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'SELECTIVE',opportunityScore:57,entryQuality:49,evidenceQuality:82,hardVetoReasons:[],policyReasons:['RISK'],distanceToBuy:11,currentPrice:75,bearValue:80,baseValue:70,bullValue:65},
];

test('audit reports decision distributions and dominant blockers',()=>{
 const r=auditAurynDecisions(rows);
 assert.equal(r.total,11);
 assert.deepEqual(r.distributions.newMoney,{AVOID:1,BUY:1,START_SMALL:1,WAIT:8});
 assert.equal(r.blockers.policy[0].reason,'ENTRY_BELOW_CONFIRM');
 assert.equal(r.blockers.policy[0].count,3);
 assert.equal(r.blockers.hard[0].reason,'SEVERE_RISK_ASYMMETRY');
});

test('audit detects contradictions without changing decisions',()=>{
 const before=JSON.stringify(rows);
 const r=auditAurynDecisions(rows);
 assert.equal(r.contradictions.attractiveAvoid.count,1);
 assert.equal(r.contradictions.highEvidenceAvoid.count,1);
 assert.equal(r.contradictions.strongOpportunityWait.count,3);
 assert.equal(JSON.stringify(rows),before);
});

test('scenario audit measures anchoring and invalid geometry',()=>{
 const r=auditAurynDecisions(rows);
 assert.equal(r.scenario.valid,10);
 assert.equal(r.scenario.invalidGeometry,1);
 assert.equal(r.scenario.baseAnchoring.within2Pct.count,7);
 assert.equal(r.scenario.baseAnchoring.within5Pct.count,8);
 assert.equal(r.scenario.independence.flag,'WATCH');
});

test('audit fingerprint is deterministic for canonical metrics',()=>{
 const a=auditAurynDecisions(rows);
 const b=auditAurynDecisions(structuredClone(rows));
 assert.equal(a.fingerprint,b.fingerprint);
 assert.match(a.fingerprint,/^[a-f0-9]{64}$/);
});

test('score histograms and closest upgrades are present',()=>{
 const r=auditAurynDecisions(rows);
 assert.equal(r.scoreHistograms.opportunity['60-79'],6);
 assert.equal(r.closestToUpgrade[0].symbol,'A');
 assert.equal(r.closestToUpgrade[0].distance,4);
});

test('package exposes V9.6.3 audit command',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.scripts['audit:v963-decisions'],'rm -rf .engine-test && tsc -p tsconfig.engine.json && node scripts/run_v963_decision_scenario_audit.mjs');
 assert.equal(pkg.scripts['test:v963'],'rm -rf .engine-test && tsc -p tsconfig.engine.json && node --test tests/auryn-v963-pwa-quality.test.mjs tests/auryn-v963-decision-scenario-audit.test.mjs tests/auryn-v963-release-gate.test.mjs');
 assert.equal(pkg.scripts['gate:v963'],'npm run test:v963 && node scripts/run_v963_release_gate.mjs && npm run gate:v957');
});
