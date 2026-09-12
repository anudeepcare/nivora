import test from "node:test";import assert from "node:assert/strict";
import {classifyResearchFailure,validateResearchDecision} from "../.engine-test/auryn/v995/research-contract.js";
test("provider failures retry and incomplete decisions fail closed",()=>{assert.equal(classifyResearchFailure({status:429}),"TEMPORARY_PROVIDER_FAILURE");assert.equal(validateResearchDecision({snapshotId:"x",newMoneyAction:"BUY",ownerAction:"HOLD",longTermAction:"ATTRACTIVE",decisionScore:70,evidenceCompleteness:80,setupState:"TRENDING"}),true);assert.equal(validateResearchDecision({snapshotId:"x"}),false)});
