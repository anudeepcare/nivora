import test from "node:test";import assert from "node:assert/strict";
import {ENGINE_VERSION,WEIGHTS_VERSION,TODAY_POLICY_VERSION} from "../.engine-test/nivora-version.js";
import {deriveTodayAction} from "../.engine-test/nivora-today.js";
import {freezeDecision} from "../.engine-test/nivora-snapshot.js";
import {gradeArenaOutcome,summarizeReliability} from "../.engine-test/nivora-arena.js";

test("V61 Trading Lab preserves V59 scoring weights",()=>{assert.equal(ENGINE_VERSION,"v65.1");assert.equal(WEIGHTS_VERSION,"v59-thesis-1");assert.equal(TODAY_POLICY_VERSION,"v65.1-starter-path-1")});

test("Today policy cannot bypass a broken thesis",()=>{const t=deriveTodayAction({thesisScore:85,opportunityScore:90,companyScore:82,thesisLabel:"BULLISH",thesisState:"Broken",timing:{label:"ATTRACTIVE",score:80},valuationLabel:"Attractive",vetoes:[],consistency:{ok:true,notes:[]}},false);assert.equal(t.action,"AVOID");assert.equal(t.blocked,true)});

test("Today distinguishes ADD for owners from BUY for new capital",()=>{const d={thesisScore:80,opportunityScore:74,companyScore:75,thesisLabel:"BULLISH",thesisState:"Intact",timing:{label:"ATTRACTIVE",score:72},valuationLabel:"Attractive",vetoes:[],consistency:{ok:true,notes:[]}};assert.equal(deriveTodayAction(d,false).action,"BUY");assert.equal(deriveTodayAction(d,true).action,"ADD")});

test("frozen snapshot fingerprint is deterministic for identical evidence",()=>{const input={symbol:"IREN",observedAt:"2026-09-01T12:00:00.000Z",price:50,decision:{thesisScore:75,action:"ACCUMULATE"},evidence:{b:2,a:1}};const a=freezeDecision(input),b=freezeDecision({...input,evidence:{a:1,b:2}});assert.equal(a.evidenceFingerprint,b.evidenceFingerprint);assert.equal(a.engineVersion,"v65.1")});

test("Arena grades benchmark-relative return",()=>{const g=gradeArenaOutcome({horizon:"90D",startPrice:100,endPrice:120,benchmarkStart:100,benchmarkEnd:110,maxDrawdownPct:-12});assert.equal(g.rawReturnPct,20);assert.equal(g.benchmarkReturnPct,10);assert.equal(g.alphaPct,10);assert.equal(g.hit,true)});

test("Reliability remains collecting below minimum sample",()=>{const r=summarizeReliability([{alphaPct:12,hit:true},{alphaPct:-3,hit:false}],30);assert.equal(r.status,"COLLECTING");assert.equal(r.label,"Collecting")});
