import test from "node:test";
import assert from "node:assert/strict";
import {buildInvestmentThesis} from "../.engine-test/auryn/v4/thesis.js";
import {buildMoatAssessment} from "../.engine-test/auryn/v4/moat.js";
import {buildNarrativeAssessment} from "../.engine-test/auryn/v4/narrative.js";

const reason=(id,text)=>({id,text,evidenceIds:[id]});

test("unchanged slow evidence fingerprint preserves prior thesis strength",()=>{
  const prior={strength:84,evidenceFingerprint:"slow-1",lastMaterialChangeAt:"2026-08-01T00:00:00Z"};
  const x=buildInvestmentThesis({
    slowScore:72,slowEvidenceFingerprint:"slow-1",prior,now:"2026-09-07T18:00:00Z",
    companyState:"Compounder",positive:[reason("e1","durable growth")],negative:[],marketMayBeMissing:[],invalidators:[]
  });
  assert.equal(x.strength,84);
  assert.equal(x.direction,"STABLE");
  assert.equal(x.lastMaterialChangeAt,prior.lastMaterialChangeAt);
});

test("new slow evidence can strengthen thesis",()=>{
  const x=buildInvestmentThesis({
    slowScore:88,slowEvidenceFingerprint:"slow-2",prior:{strength:80,evidenceFingerprint:"slow-1",lastMaterialChangeAt:"2026-08-01T00:00:00Z"},now:"2026-09-07T18:00:00Z",
    companyState:"Inflection",positive:[reason("e2","margin inflection")],negative:[],marketMayBeMissing:[],invalidators:[]
  });
  assert.equal(x.direction,"STRENGTHENING");
  assert.equal(x.directionDelta,8);
});

test("moat direction is UNKNOWN when moat evidence is absent",()=>{
  const x=buildMoatAssessment({signals:[],prior:undefined,evidenceFingerprint:"none",now:"2026-09-07T18:00:00Z",drivers:[],threats:[]});
  assert.equal(x.score,null);
  assert.equal(x.direction,"UNKNOWN");
});


test("contrarian edge requires cited evidence",()=>{
  const x=buildNarrativeAssessment({market:[],auryn:[],expectationGapScore:80});
  assert.equal(x.contrarianEdge.state,"NO_DEFENSIBLE_EDGE");
  assert.equal(x.contrarianEdge.reason,null);
});

test("positive edge is allowed only when AURYN thesis contains evidence IDs",()=>{
  const x=buildNarrativeAssessment({market:[reason("m1","market expects mature growth")],auryn:[reason("a1","new product expands TAM")],expectationGapScore:76});
  assert.equal(x.contrarianEdge.state,"POSITIVE_EDGE");
  assert.deepEqual(x.contrarianEdge.reason.evidenceIds,["a1"]);
});
