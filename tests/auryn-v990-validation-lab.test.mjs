import test from "node:test";import assert from "node:assert/strict";
import {runAurynValidationLab} from "../.engine-test/auryn/v99/validation-lab.js";
test("validation lab is deterministic and checks core invariants",()=>{const a=runAurynValidationLab(),b=runAurynValidationLab();assert.equal(a.fingerprint,b.fingerprint);assert.equal(a.status,"PASS");for(const id of ["ACTION_REACHABILITY","THREE_CLOCK_ISOLATION","VALUATION_INDEPENDENCE","NO_FAKE_SCENARIO"])assert.equal(a.checks.find(x=>x.id===id)?.status,"PASS")});
