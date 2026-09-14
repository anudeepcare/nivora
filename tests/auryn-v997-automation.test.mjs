
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";

test("calibration maturation uses canonical automation secrets",()=>{
  const s=fs.readFileSync(".github/workflows/nivora-calibration-mature.yml","utf8");
  assert.match(s,/AURYN_BASE_URL: \$\{\{ secrets\.AURYN_BASE_URL \}\}/);
  assert.match(s,/CRON_SECRET: \$\{\{ secrets\.CRON_SECRET \}\}/);
  assert.doesNotMatch(s,/AURYN_PRODUCTION_URL|TRADING_LAB_CRON_SECRET/);
});

test("validation workflow runs market cycle and is not fixed to a ten-stock burst",()=>{
  const y=fs.readFileSync(".github/workflows/auryn-v996-validation-queue.yml","utf8");
  assert.match(y,/auryn-v997-market-cycle\.mjs/);
  assert.match(y,/timeout-minutes: 12/);
  const s=fs.readFileSync("scripts/auryn-v996-queue-pump.mjs","utf8");
  assert.match(s,/MAX_RUNTIME_MS/);
  assert.match(s,/MAX_JOBS/);
  assert.match(s,/status==="deferred"/);
  assert.match(s,/waitForNextProviderWindow/);
});

test("market cycle covers full lifecycle sessions",()=>{
  const s=fs.readFileSync("scripts/auryn-v997-market-cycle.mjs","utf8");
  for(const k of ["PREMARKET","LIVE_OPEN","LIVE_MIDDAY","LIVE_POWER_HOUR","DAILY_CLOSE","AFTER_HOURS","NIGHTLY","WEEKLY"])
    assert.match(s,new RegExp(k));
});

test("Vercel remains cron free",()=>assert.deepEqual(JSON.parse(fs.readFileSync("vercel.json","utf8")),{}));
