import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("automatic outcome maturation endpoint is protected and writes arena outcomes",()=>{
 const s=fs.readFileSync("app/api/calibration/mature/route.ts","utf8");
 assert.match(s,/TRADING_LAB_CRON_SECRET|CRON_SECRET/);assert.match(s,/nivora_v59_arena_outcomes/);assert.match(s,/measureOutcome/);assert.match(s,/reliability_buckets/);
});
test("GitHub workflow matures calibration daily",()=>{
 const s=fs.readFileSync(".github/workflows/nivora-calibration-mature.yml","utf8");
 assert.match(s,/schedule:/);assert.match(s,/api\/calibration\/mature/);
});
