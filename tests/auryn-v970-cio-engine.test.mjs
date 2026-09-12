import test from "node:test";
import assert from "node:assert/strict";
import {buildAurynCioAssessment} from "../.engine-test/auryn/v97/cio-engine.js";

const base={
  scores:{business:85,earningsRevisions:72,valuation:62,marketStructure:52,catalystsRegime:58,riskAsymmetry:60},
  technical:{trend:55,momentum:48,flow:44,structure:56,structuralBreak:false},
  evidenceCompleteness:90
};

test("high quality business can remain attractive while new money waits",()=>{
 const x=buildAurynCioAssessment(base);
 assert.equal(x.longTermAction,"ATTRACTIVE");
 assert.ok(["WAIT","START_SMALL"].includes(x.newMoneyAction));
 assert.ok(x.compounderQuality>=75);
});

test("one weak fundamental family does not break a durable thesis",()=>{
 const x=buildAurynCioAssessment({...base,scores:{...base.scores,earningsRevisions:38}});
 assert.ok(x.deterioration.score<60);
 assert.notEqual(x.longTermAction,"UNATTRACTIVE");
});

test("corroborated business and earnings deterioration breaks the thesis",()=>{
 const x=buildAurynCioAssessment({...base,scores:{...base.scores,business:28,earningsRevisions:25,valuation:70,marketStructure:30,riskAsymmetry:28}});
 assert.ok(x.deterioration.score>=70);
 assert.equal(x.longTermAction,"UNATTRACTIVE");
 assert.ok(["AVOID"].includes(x.newMoneyAction));
 assert.ok(["REDUCE","EXIT"].includes(x.ownerAction));
});

test("technical weakness affects deployment more than compounder quality",()=>{
 const strong=buildAurynCioAssessment(base);
 const weak=buildAurynCioAssessment({...base,technical:{...base.technical,trend:20,momentum:18,flow:22,structure:25}});
 assert.ok(Math.abs(strong.compounderQuality-weak.compounderQuality)<=2);
 assert.ok(weak.deploymentQuality<strong.deploymentQuality);
});

test("identical evidence is deterministic",()=>{
 assert.deepEqual(buildAurynCioAssessment(base),buildAurynCioAssessment(base));
});

test("diverse evidence produces differentiated capital actions",()=>{
 const cases=[
  buildAurynCioAssessment({scores:{business:95,earningsRevisions:90,valuation:85,marketStructure:82,catalystsRegime:80,riskAsymmetry:84},technical:{trend:82,momentum:78,flow:75,structure:84,structuralBreak:false},evidenceCompleteness:96}),
  buildAurynCioAssessment({scores:{business:75,earningsRevisions:68,valuation:60,marketStructure:56,catalystsRegime:55,riskAsymmetry:58},technical:{trend:56,momentum:50,flow:48,structure:58,structuralBreak:false},evidenceCompleteness:86}),
  buildAurynCioAssessment({scores:{business:60,earningsRevisions:55,valuation:48,marketStructure:45,catalystsRegime:48,riskAsymmetry:46},technical:{trend:43,momentum:42,flow:40,structure:44,structuralBreak:false},evidenceCompleteness:80}),
  buildAurynCioAssessment({scores:{business:25,earningsRevisions:24,valuation:70,marketStructure:30,catalystsRegime:35,riskAsymmetry:22},technical:{trend:28,momentum:25,flow:30,structure:26,structuralBreak:true},evidenceCompleteness:90})
 ];
 const actions=new Set(cases.map(x=>x.newMoneyAction));
 assert.ok(actions.has("STRONG_BUY"));
 assert.ok(actions.has("START_SMALL"));
 assert.ok(actions.has("WAIT"));
 assert.ok(actions.has("AVOID"));
 assert.ok(actions.size>=4);
});
