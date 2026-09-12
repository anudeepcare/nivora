import test from "node:test";import assert from "node:assert/strict";
import {researchJobBatches} from "../.engine-test/auryn/v995/research-jobs.js";
test("autonomous research uses one symbol per durable job",()=>{assert.deepEqual(researchJobBatches(["AAPL","MSFT","JPM"]),[["AAPL"],["MSFT"],["JPM"]])});
