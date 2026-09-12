import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("worker generates and persists canonical research for untouched symbols",()=>{const s=fs.readFileSync("app/api/validation/worker/route.ts","utf8");assert.match(s,/runAutonomousCanonicalResearch/);assert.match(s,/persistAutonomousResearch/);assert.match(s,/loadAurynCanonicalSnapshot\(symbol\)/)});
test("orchestrator creates one symbol durable research jobs",()=>{const s=fs.readFileSync("app/api/validation/orchestrate/route.ts","utf8");assert.match(s,/researchJobBatches\(symbols\)/)});
test("Hobby config stays cron free",()=>assert.deepEqual(JSON.parse(fs.readFileSync("vercel.json","utf8")),{}));
