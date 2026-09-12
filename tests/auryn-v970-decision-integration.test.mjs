import test from "node:test";
import assert from "node:assert/strict";
import {buildInstitutionalDecisionKernel} from "../.engine-test/auryn/v931/decision-kernel.js";

const input=(over={})=>({
 snapshotId:"s1",symbol:"TEST",marketPrice:100,executionTradable:true,previousSetupState:null,
 scores:{business:86,earningsRevisions:73,valuation:64,marketStructure:54,catalystsRegime:60,riskAsymmetry:61},
 technical:{trend:56,momentum:50,flow:46,structure:57,nearResistance:false,confirmedBreakout:false,structuralBreak:false,reclaimLevel:105,invalidation:90},
 evidenceCompleteness:91,...over
});

test("high-quality company is not made long-term unattractive by mixed technicals",()=>{
 const x=buildInstitutionalDecisionKernel(input());
 assert.equal(x.longTermAction,"ATTRACTIVE");
 assert.notEqual(x.newMoneyAction,"AVOID");
});

test("strong quality with acceptable deployment can start small before perfect breakout",()=>{
 const x=buildInstitutionalDecisionKernel(input({scores:{business:90,earningsRevisions:82,valuation:72,marketStructure:61,catalystsRegime:66,riskAsymmetry:70}}));
 assert.ok(["START_SMALL","BUY","STRONG_BUY"].includes(x.newMoneyAction));
});

test("corroborated deterioration drives defensive owner action",()=>{
 const x=buildInstitutionalDecisionKernel(input({scores:{business:27,earningsRevisions:24,valuation:75,marketStructure:32,catalystsRegime:35,riskAsymmetry:25}}));
 assert.equal(x.longTermAction,"UNATTRACTIVE");
 assert.ok(["REDUCE","EXIT"].includes(x.ownerAction));
 assert.equal(x.newMoneyAction,"AVOID");
});
