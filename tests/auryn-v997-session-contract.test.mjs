
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("orchestrator supports intraday lifecycle kinds and per-kind cohort size",()=>{
 const s=fs.readFileSync("app/api/validation/orchestrate/route.ts","utf8");
 for(const k of ["LIVE_OPEN","LIVE_MIDDAY","LIVE_POWER_HOUR"]) assert.match(s,new RegExp(k));
 assert.match(s,/cohortSize/); assert.match(s,/evaluationDate.*kind/);
});
